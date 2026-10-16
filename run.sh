#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Check PATH first, then common local installations and Codex's bundled runtime.
node_bin=""
for candidate in "$(command -v node || true)" \
  /opt/homebrew/bin/node /usr/local/bin/node \
  "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; do
  if [[ -x "$candidate" ]] && "$candidate" -e '
    const [major, minor] = process.versions.node.split(".").map(Number)
    process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)
  '; then
    node_bin="$candidate"
    break
  fi
done

if [[ -z "$node_bin" ]]; then
  echo "Could not find Node.js 22.12 or newer: https://nodejs.org/en/download"
  exit 1
fi
export PATH="$(dirname "$node_bin"):$PATH"
echo "Using Node.js $(node --version) ($node_bin)"

node --input-type=module <<'JS'
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')
else console.log('No .env file found. Copy .env.sample to .env, or export the variables in your shell.')

const googleDocs = 'https://docs.recall.ai/docs/calendar-v1-google-calendar'
const required = [
  ['RECALL_API_KEY', 'Create an API key in your Recall region.', 'https://docs.recall.ai/reference/authentication'],
  ['GOOGLE_OAUTH_CLIENT_ID', 'Create a Google OAuth client and save its credentials in Recall.', googleDocs],
]
let missing = false
for (const [name, description, docs] of required) {
  const value = process.env[name]?.trim()
  if (!value || value === name) {
    console.error(`Missing ${name}: ${description}\n  ${docs}`)
    missing = true
  }
}

const region = process.env.RECALL_REGION || 'us-east-1'
const defaults = [
  ['RECALL_REGION', 'us-east-1', 'https://docs.recall.ai/docs/regions'],
  ['RECALL_USER_ID', 'local-demo-user', 'https://docs.recall.ai/docs/calendar-v1-integration-guide'],
  ['GOOGLE_OAUTH_REDIRECT_URI', `https://${region}.recall.ai/api/v1/calendar/google_oauth_callback/`, googleDocs],
  ['CLIENT_ORIGIN', 'http://localhost:5173', googleDocs],
]
for (const [name, fallback, docs] of defaults) {
  if (!process.env[name]) console.log(`Notice: ${name} is unset; using ${fallback}.\n  ${docs}`)
}
console.log(`Recall region: ${region}`)
if (missing) {
  console.error('Set the missing variables in .env and run ./run.sh again.')
  process.exit(1)
}
JS

if [[ ! -x node_modules/.bin/next || ! -x node_modules/.bin/concurrently || ! -x client/node_modules/.bin/vite ]]; then
  echo "Dependencies are missing. Run pnpm install first: https://pnpm.io/installation"
  exit 1
fi

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo "Press Ctrl+C to stop both servers."
exec ./node_modules/.bin/concurrently --kill-others --names backend,frontend \
  "WATCHPACK_POLLING=true ./node_modules/.bin/next dev --webpack --port 3001 --hostname 127.0.0.1" \
  "cd client && exec ./node_modules/.bin/vite"
