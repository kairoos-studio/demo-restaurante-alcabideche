#!/usr/bin/env bash
# Verificação completa: instala, faz build, lint, testes (unitários, HTML,
# créditos, artefactos e navegador) e arranque do `npm run demo`. Falha se algo falhar.
set -euo pipefail
cd "$(dirname "$0")"

export ASTRO_TELEMETRY_DISABLED=1
export CI=1
PORTA_DEMO=4497

echo "==> Dependências (npm ci)"
npm ci --no-audit --no-fund

echo "==> Build"
npm run build

echo "==> Lint (ESLint + astro check)"
npm run lint

echo "==> Testes (unitários, HTML gerado, créditos e artefactos entregues)"
npm test

echo "==> Chromium do Playwright"
if ! node -e "import('@playwright/test').then(async ({ chromium }) => { const b = await chromium.launch({ chromiumSandbox: false }); await b.close(); })" 2>/dev/null; then
  echo "Chromium em falta: a instalar a versão fixada pelo @playwright/test."
  npx playwright install chromium
fi

echo "==> Testes de navegador (telemóvel e desktop)"
npm run test:e2e

echo "==> Arranque com npm run demo"
parar_demo() { npx astro preview stop >/dev/null 2>&1 || true; }
trap parar_demo EXIT
npm run demo -- --background --port "$PORTA_DEMO"
ok=0
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORTA_DEMO/" | grep -q "Cozinha portuguesa de família"; then ok=1; break; fi
  sleep 1
done
robots=$(curl -fsS "http://localhost:$PORTA_DEMO/robots.txt" || true)
parar_demo
if [ "$ok" != 1 ]; then
  echo "ERRO: npm run demo não serviu a página." >&2
  exit 1
fi
if ! grep -q "^Disallow: /$" <<<"$robots"; then
  echo "ERRO: robots.txt não bloqueia tudo." >&2
  exit 1
fi
echo "npm run demo serviu a página e o robots.txt em localhost:$PORTA_DEMO."

echo "==> Ficheiros versionados intactos"
if [ -d .git ] && { ! git diff --quiet -- . || [ -n "$(git ls-files --others --exclude-standard)" ]; }; then
  git status --short
  echo "ERRO: a verificação alterou ou criou ficheiros versionáveis." >&2
  exit 1
fi

echo "OK: tudo verificado."
