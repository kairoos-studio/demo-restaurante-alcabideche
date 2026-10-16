// Servidor estático mínimo sobre dist/, usado pelas capturas e pelos testes de navegador.
// Uso direto: node scripts/servir.mjs [porta]
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
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

export function servir(porta, pasta = 'dist') {
  return createServer(async (pedido, resposta) => {
    const caminho = normalize(decodeURIComponent(new URL(pedido.url ?? '/', 'http://localhost').pathname));
    let ficheiro = join(pasta, caminho);
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
