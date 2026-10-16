// Cada foto no repositório tem de ter crédito no documento e na configuração.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const fotos = readdirSync('src/assets/fotos').filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
const doc = readFileSync('docs/CREDITOS-IMAGENS.md', 'utf8');
const config = readFileSync('src/config/imagens.ts', 'utf8');

test('há fotos', () => assert.ok(fotos.length > 0));

for (const f of fotos) {
  test(`crédito de ${f}`, () => {
    assert.ok(doc.includes(`\`${f}\``), `${f} em falta em docs/CREDITOS-IMAGENS.md`);
    assert.ok(config.includes(`ficheiro: '${f}'`), `${f} em falta em src/config/imagens.ts`);
  });
}

test('só licenças que permitem este uso', () => {
  const licencas = [...config.matchAll(/licenca: (\w+),/g)].map((m) => m[1]);
  assert.equal(licencas.length, fotos.length);
  for (const l of licencas) assert.ok(['CC0', 'CC_BY_4', 'CC_BY_SA_4'].includes(l), `licença inesperada: ${l}`);
  for (const fonte of config.matchAll(/fonte: '([^']+)'/g)) {
    assert.match(fonte[1], /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  }
});

test('README tem a nota de conceito e lista os [POR CONFIRMAR]', () => {
  const readme = readFileSync('README.md', 'utf8');
  assert.ok(readme.includes('Conceito não oficial, feito para apresentação. Não é o site do restaurante.'));
  for (const tipo of ['horário', 'telefone', 'preço', 'WhatsApp']) {
    assert.ok(readme.includes(`[POR CONFIRMAR: ${tipo}]`), `README sem [POR CONFIRMAR: ${tipo}]`);
  }
  assert.match(readme, /npm run demo/);
});

test('todos os [POR CONFIRMAR] estão num único ficheiro de configuração', () => {
  const config = readFileSync('src/config/restaurante.ts', 'utf8');
  for (const tipo of ['horário', 'telefone', 'preço', 'WhatsApp']) {
    assert.ok(config.includes(`[POR CONFIRMAR: ${tipo}]`), `restaurante.ts sem [POR CONFIRMAR: ${tipo}]`);
  }
  // Valores ainda por confirmar: nada preenchido com dados inventados.
  assert.match(config, /telefone: null as/);
  assert.match(config, /whatsapp: null as/);
  assert.match(config, /descanso: null as/);
  assert.doesNotMatch(config, /preco: \d/);
  assert.doesNotMatch(config, /(dias|horas): '/);
});
