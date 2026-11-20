require('reflect-metadata');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ensureApiToken, API_TOKEN_HEADER } = require('../dist/common/api-token');
const { getAppDir } = require('../dist/common/paths');
const { ApiTokenMiddleware } = require('../dist/common/api-token.middleware');

function fakeResponse() {
  return {
    code: null,
    body: null,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('ensureApiToken crea y reutiliza un token de 64 caracteres hexadecimales', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'reporte-token-'));
  const first = ensureApiToken(dir);
  const second = ensureApiToken(dir);

  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(first, second);
  assert.equal(fs.readFileSync(path.join(dir, '.token'), 'utf-8').trim(), first);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('el middleware rechaza peticiones sin token y acepta las que lo traen', () => {
  const middleware = new ApiTokenMiddleware();
  const token = ensureApiToken(getAppDir());

  const denied = fakeResponse();
  middleware.use({ get: () => undefined }, denied, () => assert.fail('No debería pasar'));
  assert.equal(denied.code, 401);

  const allowed = fakeResponse();
  let passed = false;
  middleware.use(
    { get: (name) => (name === API_TOKEN_HEADER ? token : undefined) },
    allowed,
    () => { passed = true; },
  );
  assert.equal(passed, true);
  assert.equal(allowed.code, null);
});
