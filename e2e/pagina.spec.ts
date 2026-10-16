import { expect, test, type Page } from '@playwright/test';

/** Regista pedidos para fora de localhost e erros da consola. */
function vigiar(page: Page) {
  const externos: string[] = [];
  const erros: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'data:') externos.push(r.url());
  });
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  page.on('pageerror', (e) => erros.push(e.message));
  return { externos, erros };
}

async function percorrer(page: Page) {
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= altura; y += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(40);
  }
}

test('primeiro ecrã: faixa de conceito, nome, foto e botão de reserva visíveis', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Conceito não oficial, feito para apresentação. Não é o site do restaurante.').first()).toBeInViewport();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/A\s*Ponte/);
  await expect(page.locator('.hero__moldura img')).toBeInViewport({ ratio: 0.5 });
  const reservar = page.getByRole('link', { name: 'Reservar mesa' });
  await expect(reservar).toBeInViewport();
  await reservar.click();
  await expect(page.locator('#reserva-titulo')).toBeInViewport();
});

test('formulário simulado: valida, confirma, não envia nada e deixa repetir', async ({ page }) => {
  const { externos, erros } = vigiar(page);
  await page.goto('/');
  await page.locator('#form-reserva').scrollIntoViewIfNeeded();

  // Envios possíveis: navegação, fetch/XHR, beacons ou qualquer método que não GET.
  const envios: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET' || ['document', 'fetch', 'xhr', 'ping', 'eventsource', 'websocket'].includes(r.resourceType())) {
      envios.push(`${r.method()} ${r.resourceType()} ${r.url()}`);
    }
  });

  // Vazio (ou só espaços no nome): mostra erro e não confirma
  await page.getByLabel('Nome').fill('   ');
  await page.getByRole('button', { name: 'Pedir reserva' }).click();
  await expect(page.getByRole('alert')).toHaveText('Preencha o nome, o dia e a hora.');
  await expect(page.locator('#confirmacao')).toBeHidden();

  await page.getByLabel('Nome').fill('Ana Exemplo');
  const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.locator('input[name="dia"]').fill(amanha);
  await page.locator('input[name="hora"]').fill('20:30');
  await page.getByLabel('Pessoas').selectOption('4');
  await page.getByRole('button', { name: 'Pedir reserva' }).click();

  const confirmacao = page.locator('#confirmacao');
  await expect(confirmacao).toBeVisible();
  await expect(confirmacao).toBeFocused();
  await expect(page.locator('#confirmacao-resumo')).toHaveText(/^Ana Exemplo, mesa para 4 pessoas, .+, às 20:30\.$/);
  await expect(confirmacao).toContainText('nada foi enviado nem guardado');
  await expect(page.locator('#form-reserva')).toBeHidden();
  expect(page.url()).not.toContain('?');
  expect(envios, 'a submissão não pode enviar dados').toEqual([]);

  await page.getByRole('button', { name: 'Fazer outro pedido' }).click();
  await expect(page.locator('#form-reserva')).toBeVisible();
  await expect(page.getByLabel('Nome')).toHaveValue('');
  await expect(page.getByLabel('Nome')).toBeFocused();

  expect(externos).toEqual([]);
  expect(erros).toEqual([]);
});

test('página inteira sem pedidos externos nem erros, e todas as imagens carregam', async ({ page }) => {
  const { externos, erros } = vigiar(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await percorrer(page);
  await page.waitForLoadState('networkidle');
  expect(externos).toEqual([]);
  expect(erros).toEqual([]);
  const partidas = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length);
  expect(partidas).toBe(0);
});

test('telefone e WhatsApp por confirmar: botões desativados e assinalados', async ({ page }) => {
  await page.goto('/');
  const botoes = page.locator('[data-contacto]');
  await expect(botoes).toHaveCount(2);
  for (const b of await botoes.all()) await expect(b).toBeDisabled();
  await expect(page.getByText('Telefone e WhatsApp por confirmar.')).toBeVisible();
  await expect(page.locator('a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
});

test('marcadores por confirmar discretos, com o texto no title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-por-confirmar="preço"]')).toHaveCount(8);
  await expect(page.locator('[data-por-confirmar="telefone"]')).toHaveCount(1);
  await expect(page.locator('[data-por-confirmar="horário"]').first()).toHaveAttribute('title', '[POR CONFIRMAR: horário]');
  // O texto "[POR CONFIRMAR: …]" fica só para leitores de ecrã: no ecrã ocupa 1 px no máximo.
  const caixas = await page.locator('.pc .sr-only').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  expect(caixas.length).toBeGreaterThan(0);
  for (const largura of caixas) expect(largura).toBeLessThanOrEqual(1);
});

test('créditos das imagens no rodapé abrem e ligam às páginas de origem', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Créditos das imagens').click();
  const links = page.locator('.rodape__creditos a');
  await expect(links).toHaveCount(9);
  await expect(links.first()).toBeVisible();
  await expect(links.first()).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
});

test('barra de atalhos só no telemóvel, depois do hero e fora da reserva', async ({ page, isMobile }) => {
  await page.goto('/');
  const barra = page.locator('[data-barra]');
  if (!isMobile) {
    await expect(barra).toBeHidden();
    return;
  }
  await expect(barra).not.toHaveClass(/barra--visivel/);
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await expect(barra).toHaveClass(/barra--visivel/);
  await expect(barra.getByRole('link', { name: 'Reservar' })).toBeInViewport();
  await page.locator('#form-reserva').scrollIntoViewIfNeeded();
  await expect(barra).not.toHaveClass(/barra--visivel/);
});

test('sem deslocamento horizontal', async ({ page }) => {
  await page.goto('/');
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(largura).toBeLessThanOrEqual(0);
});

test('funciona sem JavaScript: conteúdo visível', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.locator('#menu').scrollIntoViewIfNeeded();
  await expect(page.locator('.destaque').first()).toHaveCSS('opacity', '1');
  await ctx.close();
});

test.describe('fuso Europe/Lisbon', () => {
  test.use({ timezoneId: 'Europe/Lisbon' });

  test('data mínima é o dia local, mesmo entre as 00h e a 01h no horário de verão', async ({ page }) => {
    // 15/07/2026 23:30 UTC = 16/07/2026 00:30 em Lisboa (UTC+1).
    await page.clock.install({ time: new Date('2026-07-15T23:30:00Z') });
    await page.goto('/');
    await expect(page.locator('input[name="dia"]')).toHaveAttribute('min', '2026-07-16');
  });
});
