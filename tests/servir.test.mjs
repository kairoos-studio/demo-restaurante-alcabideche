// Servidor estático usado pelos testes de navegador e pelas capturas.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { servir } from '../scripts/servir.mjs';

const base = mkdtempSync(join(tmpdir(), 'servir-'));
const pasta = join(base, 'dist');
mkdirSync(pasta);
writeFileSync(join(pasta, 'index.html'), '<p>ok</p>');
writeFileSync(join(base, 'segredo.txt'), 'fora da pasta');

const PORTA = 4471;
let servidor;
before(() => new Promise((ok) => (servidor = servir(PORTA, pasta).on('listening', ok))));
after(() => new Promise((ok) => servidor.close(ok)));

/** Pedido HTTP sem normalizar a URL (o fetch resolveria os ".."). */
async function pedir(caminho) {
  const { request } = await import('node:http');
  return new Promise((ok, falha) => {
    request({ host: 'localhost', port: PORTA, path: caminho }, (r) => {
      r.resume();
      r.on('end', () => ok(r.statusCode));
    })
      .on('error', falha)
      .setTimeout(3000, function () {
        this.destroy(new Error(`sem resposta a ${caminho}: o servidor caiu?`));
      })
      .end();
  });
}

test('serve o index', async () => assert.equal(await pedir('/'), 200));

test('percentagem inválida responde 400 e o servidor continua de pé', async () => {
  assert.equal(await pedir('/%'), 400);
  assert.equal(await pedir('/%E0%A4%A'), 400);
  assert.equal(await pedir('/'), 200);
});

test('não sai da pasta servida', async () => {
  // Os ".." ficam presos à raiz de dist/: o ficheiro de fora nunca é servido.
  for (const caminho of ['/%2e%2e/segredo.txt', '/..%2fsegredo.txt', '/../segredo.txt', '/%2e%2e%2f%2e%2e%2fsegredo.txt']) {
    assert.equal(await pedir(caminho), 404, caminho);
  }
});

test('ficheiro inexistente responde 404', async () => assert.equal(await pedir('/nada.css'), 404));
