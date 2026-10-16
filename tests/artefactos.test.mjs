// Valida os entregáveis versionados: prints (PNG) e vídeo mobile (MP4, até 1 minuto).
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function dimensoesPng(caminho) {
  const b = readFileSync(caminho);
  assert.ok(b.subarray(0, 8).equals(PNG), `${caminho} não é PNG`);
  return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
}

/** Duração em segundos de um MP4, lida da caixa `mvhd` (versão 0 ou 1). */
export function duracaoMp4(b) {
  assert.equal(b.toString('latin1', 4, 8), 'ftyp', 'não é MP4');
  const i = b.indexOf('mvhd', 0, 'latin1');
  assert.ok(i > 0, 'MP4 sem mvhd');
  const versao = b[i + 4];
  if (versao === 1) {
    const escala = b.readUInt32BE(i + 24);
    return Number(b.readBigUInt64BE(i + 28)) / escala;
  }
  return b.readUInt32BE(i + 20) / b.readUInt32BE(i + 16);
}

const PRINTS = {
  'mobile-1-hero.png': { largura: 780, altura: 1328 },
  'mobile-2-menu.png': { largura: 780, altura: 1328 },
  'mobile-3-galeria.png': { largura: 780, altura: 1328 },
  'mobile-4-reserva.png': { largura: 780, altura: 1328 },
  'mobile-pagina-inteira.png': { largura: 390 },
  'desktop-1-hero.png': { largura: 1440, altura: 900 },
  'desktop-2-menu.png': { largura: 1440, altura: 900 },
  'desktop-pagina-inteira.png': { largura: 1440 },
};

for (const [nome, esperado] of Object.entries(PRINTS)) {
  test(`print ${nome}`, () => {
    const d = dimensoesPng(`docs/prints/${nome}`);
    assert.equal(d.largura, esperado.largura);
    if (esperado.altura) assert.equal(d.altura, esperado.altura);
    else assert.ok(d.altura > 3000, 'página inteira demasiado curta');
  });
}

test('vídeo mobile em MP4 com até 1 minuto', () => {
  const caminho = 'docs/video/percurso-mobile.mp4';
  assert.ok(statSync(caminho).size < 20 * 1024 * 1024, 'vídeo demasiado grande');
  const s = duracaoMp4(readFileSync(caminho));
  assert.ok(s > 15 && s <= 60, `duração inesperada: ${s.toFixed(1)} s`);
});
