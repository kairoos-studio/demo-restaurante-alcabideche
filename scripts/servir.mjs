// Servidor estático mínimo sobre dist/, usado pelas capturas e pelos testes de navegador.
// Uso direto: node scripts/servir.mjs [porta]
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** Caminho do ficheiro dentro de `pasta`, ou `null` se a URL for inválida ou sair da pasta. */
export function resolverCaminho(url, pasta = 'dist') {
  let caminho;
  try {
    caminho = decodeURIComponent(new URL(url ?? '/', 'http://localhost').pathname);
  } catch {
    return null; // ex.: "/%" (URIError)
  }
  const raiz = resolve(pasta);
  const ficheiro = resolve(raiz, `.${normalize(`/${caminho}`)}`);
  if (ficheiro !== raiz && !ficheiro.startsWith(raiz + sep)) return null; // ex.: "/%2e%2e/"
  return ficheiro;
}

export function servir(porta, pasta = 'dist') {
  return createServer(async (pedido, resposta) => {
    let ficheiro = resolverCaminho(pedido.url, pasta);
    if (ficheiro === null) {
      resposta.writeHead(400).end();
      return;
    }
    try {
      if ((await stat(ficheiro)).isDirectory()) ficheiro = join(ficheiro, 'index.html');
      await stat(ficheiro);
      resposta.writeHead(200, { 'Content-Type': TIPOS[extname(ficheiro)] ?? 'application/octet-stream' });
      createReadStream(ficheiro).pipe(resposta);
    } catch {
      resposta.writeHead(404).end();
    }
  }).listen(porta);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.argv[2] ?? 4398);
  servir(porta);
  console.log(`A servir dist/ em http://localhost:${porta}/`);
}
