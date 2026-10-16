// Verifica o HTML gerado (corre depois de `npm run build`).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const INDEX = 'dist/index.html';
assert.ok(existsSync(INDEX), 'Falta dist/index.html: correr `npm run build` antes dos testes.');
const html = readFileSync(INDEX, 'utf8');
const texto = html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ');
const FAIXA = 'Conceito não oficial, feito para apresentação. Não é o site do restaurante.';

test('faixa de conceito não oficial no topo e no rodapé', () => {
  assert.ok(html.split(FAIXA).length - 1 >= 2);
  assert.ok(html.indexOf(FAIXA) < html.indexOf('<h1'), 'a faixa tem de vir antes do nome');
});

test('noindex, nofollow na página e robots.txt a bloquear tudo', () => {
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  const robots = readFileSync('dist/robots.txt', 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Disallow: \/$/m);
});

test('todas as secções pedidas existem, pela ordem', () => {
  const ids = ['topo', 'horario', 'menu', 'galeria', 'sobre', 'reservar', 'onde'];
  const posicoes = ids.map((id) => html.indexOf(`id="${id}"`));
  posicoes.forEach((p, i) => assert.ok(p > 0, `falta a secção #${ids[i]}`));
  assert.deepEqual([...posicoes].sort((a, b) => a - b), posicoes);
  assert.match(html, /<footer/);
  assert.match(html, /<h1[^>]*>[\s\S]*A[\s\S]*Ponte[\s\S]*<\/h1>/);
});

test('horário num único bloco', () => {
  assert.equal((html.match(/class="placa__linhas/g) ?? []).length, 1);
});

test('menu: destaques polvo, arroz de tamboril e sardinhas, mais os restantes pratos', () => {
  const destaques = [...html.matchAll(/class="destaque [^"]*"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(destaques, ['Polvo', 'Arroz de tamboril', 'Sardinhas']);
  for (const prato of ['Costeleta de borrego', 'Peixe fresco do dia', 'Carnes grelhadas', 'Paella', 'Vinho a copo']) {
    assert.ok(texto.includes(prato), `falta ${prato}`);
  }
});

test('marcadores [POR CONFIRMAR] de horário, telefone, preço e WhatsApp', () => {
  for (const tipo of ['horário', 'telefone', 'preço', 'WhatsApp']) {
    assert.ok(html.includes(`[POR CONFIRMAR: ${tipo}]`), `falta [POR CONFIRMAR: ${tipo}]`);
  }
  const precos = html.match(/data-por-confirmar="preço"/g) ?? [];
  assert.equal(precos.length, 8, 'os 8 pratos do menu devem ter preço por confirmar');
});

test('nenhum preço, telefone, horário ou avaliação inventados', () => {
  assert.doesNotMatch(texto, /\d+[,.]\d{2}\s?€|€\s?\d/, 'há um preço em euros');
  assert.doesNotMatch(texto, /\b\d{1,2}\s?[:h]\s?\d{2}\b/, 'há uma hora escrita');
  assert.doesNotMatch(texto, /\b[29]\d{2}\s?\d{3}\s?\d{3}\b/, 'há um telefone');
  assert.doesNotMatch(texto, /\b[1-5][,.]\d\s?(\/\s?5|estrelas)|★/i, 'há uma classificação');
  assert.doesNotMatch(html, /href="tel:|href="https:\/\/wa\.me/);
});

test('botões de telefone e WhatsApp desativados e assinalados enquanto não há número', () => {
  const botoes = html.match(/<button[^>]*data-contacto="(telefone|whatsapp)"[^>]*>/g) ?? [];
  assert.equal(botoes.length, 2);
  for (const b of botoes) assert.match(b, /disabled/);
  assert.match(texto, /Telefone e WhatsApp por confirmar/);
});

test('formulário de reserva é simulação e está assinalado', () => {
  assert.match(html, /<form[^>]*id="form-reserva"/);
  assert.doesNotMatch(html, /<form[^>]*(action|method)=/, 'o formulário não deve ter action nem method');
  assert.match(texto, /Simulação · não envia/);
  assert.match(texto, /nada foi enviado nem guardado/);
});

test('sem serviços externos: scripts, estilos, iframes, fontes e analytics', () => {
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  assert.doesNotMatch(html, /<link[^>]+href="https?:/);
  assert.doesNotMatch(html, /<iframe|<embed|<object/);
  assert.doesNotMatch(html, /googletagmanager|google-analytics|gtag\(|plausible|fonts\.googleapis|umami|clarity/);
  for (const ficheiro of readdirSync('dist/_astro').filter((f) => /\.(css|js)$/.test(f))) {
    const conteudo = readFileSync(`dist/_astro/${ficheiro}`, 'utf8');
    assert.doesNotMatch(conteudo, /url\(["']?https?:|fetch\(|XMLHttpRequest|sendBeacon/, `${ficheiro} faz pedidos externos`);
  }
});

test('localização: morada, link de mapa sem embed nem chave e nota de estacionamento', () => {
  assert.match(texto, /Rua de São Bernardo/);
  assert.match(texto, /2755-069 Alcabideche/);
  assert.match(html, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=[^"]+"/);
  assert.doesNotMatch(html, /[?&](amp;)?key=/);
  assert.match(texto, /Estacionamento\./);
});

test('imagens com texto alternativo e créditos de cada foto no rodapé', () => {
  const imgs = html.match(/<img[^>]*>/g) ?? [];
  assert.ok(imgs.length >= 9);
  for (const img of imgs) assert.match(img, /alt="[^"]+"/);
  const rodape = html.slice(html.indexOf('<footer'));
  const fontes = [...readFileSync('src/config/imagens.ts', 'utf8').matchAll(/fonte: '([^']+)'/g)].map((m) => m[1]);
  assert.equal(fontes.length, 9);
  for (const f of fontes) assert.ok(rodape.includes(`href="${f.replaceAll('&', '&amp;')}"`), `crédito em falta no rodapé: ${f}`);
});
