// Teste de regressão de segurança: nenhum endpoint pode devolver hash de senha.
//
// A intenção é pegar o vazamento na origem. A defesa real está no
// `select` CAMPOS_PUBLICOS do userRepository; se alguém adicionar um
// endpoint novo e esquecer do select, este teste quebra.
//
// Rodar:  node --test test/password-leak.test.mjs
// (precisa do backend no ar em http://localhost:3001 e do banco populado)

import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const API = process.env.API_URL ?? "http://localhost:3001";

// Assinaturas de hash bcrypt. Qualquer uma delas aparecendo numa resposta
// significa que o hash vazou.
const ASSINATURAS_HASH = [/\$2[aby]\$\d{2}\$/, /^\$2[aby]\$/];

let adminCookie;
let userCookie;

/** Percorre o JSON inteiro atrás de um valor que pareça hash de senha. */
function acharHash(noz, caminho = "$") {
    const achados = [];

    if (typeof noz === "string") {
        if (ASSINATURAS_HASH.some((r) => r.test(noz))) {
            achados.push({ caminho, valor: noz.slice(0, 12) + "..." });
        }
        return achados;
    }
    if (Array.isArray(noz)) {
        noz.forEach((item, i) => achados.push(...acharHash(item, `${caminho}[${i}]`)));
        return achados;
    }
    if (noz && typeof noz === "object") {
        for (const [chave, valor] of Object.entries(noz)) {
            achados.push(...acharHash(valor, `${caminho}.${chave}`));
        }
    }
    return achados;
}

async function pedir(metodo, caminho, { cookie, corpo } = {}) {
    const res = await fetch(API + caminho, {
        method: metodo,
        headers: {
            ...(corpo ? { "Content-Type": "application/json" } : {}),
            ...(cookie ? { cookie } : {}),
        },
        ...(corpo ? { body: JSON.stringify(corpo) } : {}),
    });
    const texto = await res.text();
    let json;
    try {
        json = JSON.parse(texto);
    } catch {
        json = texto;
    }
    return { status: res.status, corpo: json };
}

async function autenticar(email, senha) {
    const { corpo } = await pedir("POST", "/usuarios/login", {
        corpo: { email, password: senha },
    });
    const raw = corpo?.user ? "ok" : "falhou";
    if (raw === "falhou") {
        throw new Error(`login de ${email} falhou: ${JSON.stringify(corpo)}`);
    }
    // refaz a chamada só para pegar o cookie
    const res = await fetch(`${API}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
    });
    return (res.headers.get("set-cookie") || "").split(";")[0];
}

before(async () => {
    adminCookie = await autenticar("bruno@grupoilla.com.br", "senha123");
    userCookie = await autenticar("maria@grupoilla.com.br", "senha123");
});

after(() => {});

const ENDPOINTS = [
    ["GET", "/usuarios/me", { cookie: "adminCookie" }],
    ["GET", "/usuarios/buscarTodos", { cookie: "adminCookie" }],
    ["GET", "/usuarios/me", { cookie: "userCookie" }],
    ["PATCH", "/usuarios/atualizarUsuario/3", { cookie: "adminCookie", corpo: { phone: "11900001111" } }],
    ["PATCH", "/usuarios/atualizarUsuario/1", { cookie: "userCookie", corpo: { phone: "11911112222" } }],
];

for (const [metodo, caminho, opts] of ENDPOINTS) {
    test(`${metodo} ${caminho} não devolve hash de senha`, async () => {
        const cookie = opts.cookie === "adminCookie" ? adminCookie : userCookie;
        const { status, corpo } = await pedir(metodo, caminho, { cookie, corpo: opts.corpo });

        assert.ok(status < 500, `${caminho} respondeu ${status}: ${JSON.stringify(corpo).slice(0, 200)}`);

        const achados = acharHash(corpo);
        assert.deepEqual(
            achados,
            [],
            `hash de senha vazou em ${caminho}: ${JSON.stringify(achados)}`,
        );
    });
}

test("a coluna password não existe em nenhum usuario retornado", async () => {
    const { corpo } = await pedir("GET", "/usuarios/buscarTodos", { cookie: adminCookie });
    const lista = Array.isArray(corpo) ? corpo : corpo?.user ?? [];
    for (const usuario of lista) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(usuario, "password"),
            false,
            `usuário ${usuario?.email} veio com a propriedade password`,
        );
    }
});

test("PATCH com senha grava bcrypt, nunca texto puro", async () => {
    const novaSenha = "senha-de-teste-123";
    const { status } = await pedir("PATCH", "/usuarios/atualizarUsuario/3", {
        cookie: adminCookie,
        corpo: { password: novaSenha },
    });
    assert.ok(status < 500, `PATCH com senha respondeu ${status}`);

    // A senha nova precisa autenticar, e o hash no banco tem que ser bcrypt.
    await assert.doesNotReject(
        () => autenticar("nilton@grupoilla.com.br", novaSenha),
        "a senha nova não autenticou — provavelmente não foi hasheada",
    );

    // devolve a senha original para não deixar o dado alterado
    await pedir("PATCH", "/usuarios/atualizarUsuario/3", {
        cookie: adminCookie,
        corpo: { password: "senha123" },
    });
});
