import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  dataLocalISO,
  formatarPreco,
  linkMapa,
  linkTelefone,
  linkWhatsApp,
  MARCADOR_PRECO,
  resumoReserva,
} from '../src/lib/formatar.ts';

test('preço por confirmar mostra o marcador', () => {
  assert.equal(formatarPreco(null), MARCADOR_PRECO);
  assert.equal(MARCADOR_PRECO, '—,— €');
});

test('preço confirmado usa vírgula decimal', () => {
  assert.equal(formatarPreco(12.5), '12,50 €');
  assert.equal(formatarPreco(3), '3,00 €');
});

test('sem número não há link de telefone nem de WhatsApp', () => {
  assert.equal(linkTelefone(null), null);
  assert.equal(linkWhatsApp(null, 'Olá'), null);
});

test('telefone fictício gera tel: só com dígitos', () => {
  assert.equal(linkTelefone('+351 210 000 000'), 'tel:+351210000000');
});

test('WhatsApp fictício limpa espaços e o + e leva a mensagem', () => {
  const url = new URL(linkWhatsApp('+351 900 000 000', 'Mesa para 2?') ?? '');
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/351900000000');
  assert.equal(url.searchParams.get('text'), 'Mesa para 2?');
});

test('números curtos demais são rejeitados', () => {
  assert.throws(() => linkTelefone('123'));
  assert.throws(() => linkWhatsApp('12 34', 'Olá'));
});

test('link do mapa é uma pesquisa, sem chave', () => {
  const url = new URL(linkMapa('Rua de São Bernardo, 2755-069 Alcabideche'));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('query'), 'Rua de São Bernardo, 2755-069 Alcabideche');
  assert.ok(!url.searchParams.has('key'));
});

test('data local em AAAA-MM-DD, com zeros à esquerda', () => {
  assert.equal(dataLocalISO(new Date(2026, 0, 5, 0, 30)), '2026-01-05');
  assert.equal(dataLocalISO(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});

test('resumo da reserva simulada', () => {
  const r = resumoReserva('  Ana Exemplo ', '4', '2026-11-07', '20:30');
  assert.match(r, /^Ana Exemplo, mesa para 4 pessoas, .+, às 20:30\.$/);
  assert.match(r, /novembro/);
  assert.match(resumoReserva('Rui', '1', '2026-11-07', '13:00'), /mesa para 1 pessoa,/);
  assert.match(resumoReserva('Rui', '10', '2026-11-07', '13:00'), /mesa para 10 ou mais pessoas,/);
});
