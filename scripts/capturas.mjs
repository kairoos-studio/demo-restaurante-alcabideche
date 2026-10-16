// Gera os prints (docs/prints/) e o vídeo mobile (docs/video/) a partir do build.
// Uso: npm run build && npm run capturas   (precisa de `npx playwright install chromium`)
// O Playwright grava em WebM; se houver ffmpeg (no PATH ou em $FFMPEG), converte
// para MP4 (H.264), que abre em qualquer telemóvel. Sem ffmpeg fica o WebM.
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';
import { servir } from './servir.mjs';

const PORTA = 4429;
const URL_BASE = `http://localhost:${PORTA}/`;
const PRINTS = 'docs/prints';
const VIDEO = 'docs/video';
const TMP_VIDEO = 'docs/video/.tmp';

const servidor = servir(PORTA);

async function esperarServidor() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(URL_BASE);
      if (r.ok) return;
    } catch {
      // ainda a arrancar
    }
    await new Promise((ok) => setTimeout(ok, 500));
  }
  throw new Error('O servidor de preview não arrancou.');
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Mostra todos os blocos com animação de entrada (para prints de página inteira). */
async function revelarTudo(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.revelar').forEach((el) => el.classList.add('visivel'));
    document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
  });
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  // Percorrer a página para o Chromium pintar todas as imagens antes da captura inteira.
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altura; y += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await esperar(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await esperar(800);
}

/** Desliga o scroll suave global do site (CSS), para as posições serem exatas. */
async function semScrollSuave(page) {
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
}

/** Deslocação instantânea até ao topo de um elemento, esperando pela posição final. */
async function irPara(page, seletor) {
  await page.evaluate((sel) => {
    const alvo = document.querySelector(sel);
    if (!alvo) throw new Error(`Elemento em falta: ${sel}`);
    window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  }, seletor);
  await page.waitForFunction((sel) => {
    const topo = document.querySelector(sel)?.getBoundingClientRect().top ?? 0;
    const noFim = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
    return Math.abs(topo) < 2 || noFim;
  }, seletor);
  await esperar(700);
}

/** Scroll suave até um elemento, em passos pequenos (para o vídeo). */
async function deslizarAte(page, seletor, duracao = 1800) {
  await page.evaluate(
    async ({ seletor, duracao }) => {
      const alvo = document.querySelector(seletor);
      if (!alvo) return;
      const inicio = window.scrollY;
      const fim = Math.min(
        alvo.getBoundingClientRect().top + window.scrollY - 12,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const t0 = performance.now();
      await new Promise((ok) => {
        const passo = (t) => {
          const p = Math.min(1, (t - t0) / duracao);
          const s = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
          window.scrollTo(0, inicio + (fim - inicio) * s);
          if (p < 1) requestAnimationFrame(passo);
          else ok();
        };
        requestAnimationFrame(passo);
      });
    },
    { seletor, duracao },
  );
}

async function prints(browser) {
  // Mobile
  const mobile = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT', deviceScaleFactor: 2 });
  let page = await mobile.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await semScrollSuave(page);
  await esperar(1500);
  await page.screenshot({ path: `${PRINTS}/mobile-1-hero.png` });
  await revelarTudo(page);
  for (const [nome, sel] of [
    ['mobile-2-menu', '#menu'],
    ['mobile-3-galeria', '#galeria'],
    ['mobile-4-reserva', '#reservar'],
  ]) {
    await irPara(page, sel);
    await page.screenshot({ path: `${PRINTS}/${nome}.png` });
  }
  await mobile.close();

  const mobileInteiro = await browser.newContext({ ...devices['iPhone 13'], locale: 'pt-PT', deviceScaleFactor: 1 });
  page = await mobileInteiro.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await semScrollSuave(page);
  await revelarTudo(page);
  // A barra fixa ficaria a meio da imagem numa captura de página inteira.
  await page.addStyleTag({ content: '[data-barra]{display:none!important}' });
  await page.screenshot({ path: `${PRINTS}/mobile-pagina-inteira.png`, fullPage: true });
  await mobileInteiro.close();

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-PT' });
  page = await desktop.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await semScrollSuave(page);
  await esperar(1500);
  await page.screenshot({ path: `${PRINTS}/desktop-1-hero.png` });
  await revelarTudo(page);
  await irPara(page, '#menu');
  await page.screenshot({ path: `${PRINTS}/desktop-2-menu.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${PRINTS}/desktop-pagina-inteira.png`, fullPage: true });
  await desktop.close();
}

async function video(browser) {
  await rm(TMP_VIDEO, { recursive: true, force: true });
  const { viewport } = devices['iPhone 13'];
  const ctx = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'pt-PT',
    deviceScaleFactor: 2,
    recordVideo: { dir: TMP_VIDEO, size: { width: viewport.width * 2, height: viewport.height * 2 } },
  });
  const page = await ctx.newPage();
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await semScrollSuave(page);
  await esperar(3500);
  for (const [sel, pausa] of [
    ['#horario', 2500],
    ['#menu', 1500],
    ['.destaque:nth-child(2)', 1500],
    ['.destaque:nth-child(3)', 1500],
    ['.carta', 2500],
    ['#galeria', 1000],
    ['.galeria__grelha', 2000],
    ['#sobre', 2500],
    ['#reservar', 2000],
  ]) {
    await deslizarAte(page, sel);
    await esperar(pausa);
  }
  // Formulário de demonstração
  await deslizarAte(page, '#form-reserva', 1000);
  await page.fill('input[name="nome"]', 'Ana Exemplo', { timeout: 5000 });
  const amanha = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.fill('input[name="dia"]', amanha);
  await page.fill('input[name="hora"]', '20:30');
  await page.selectOption('select[name="pessoas"]', '4');
  await esperar(800);
  await page.click('.form__enviar');
  await esperar(3000);
  for (const [sel, pausa] of [
    ['#onde', 2500],
    ['.rodape', 2000],
  ]) {
    await deslizarAte(page, sel);
    await esperar(pausa);
  }
  await deslizarAte(page, '#topo', 2200);
  await esperar(1500);
  const caminho = await page.video()?.path();
  await ctx.close();
  if (caminho) await rename(caminho, `${VIDEO}/percurso-mobile.webm`);
  await rm(TMP_VIDEO, { recursive: true, force: true });
  await paraMp4(`${VIDEO}/percurso-mobile.webm`, `${VIDEO}/percurso-mobile.mp4`);
}

/** Converte para MP4 (H.264 + faststart) se houver ffmpeg; nesse caso apaga o WebM. */
function paraMp4(webm, mp4) {
  const ffmpeg = process.env.FFMPEG || 'ffmpeg';
  try {
    execFileSync(ffmpeg, ['-version'], { stdio: 'ignore' });
  } catch {
    console.warn('ffmpeg não encontrado: o vídeo fica em WebM.');
    return;
  }
  execFileSync(
    ffmpeg,
    ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', mp4],
    { stdio: 'inherit' },
  );
  return rm(webm);
}

try {
  await mkdir(PRINTS, { recursive: true });
  await mkdir(VIDEO, { recursive: true });
  await esperarServidor();
  const browser = await chromium.launch({ chromiumSandbox: false, args: ['--lang=pt-PT'] });
  await prints(browser);
  await video(browser);
  await browser.close();
  console.log('Prints:', (await readdir(PRINTS)).join(', '));
  console.log('Vídeo:', (await readdir(VIDEO)).join(', '));
} finally {
  servidor.close();
}
