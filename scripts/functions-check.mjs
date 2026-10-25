#!/usr/bin/env node
// Guards for the Cloudflare Pages Functions behind the report form. Node 20+ has the same
// Request/Response globals Workers do, so the handlers run here unmodified, with fetch stubbed.
// Run: node scripts/functions-check.mjs
import assert from 'node:assert/strict';

const { onRequest: reportDownload } = await import('../functions/api/report-download.js');
const { onRequest: waitlist } = await import('../functions/api/waitlist.js');

let failed = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('ok  ' + name); } catch (e) { failed++; console.error('FAIL ' + name + '\n' + e.message); }
};

const ENV = { BREVO_API_KEY: 'k', BREVO_REPORT_LIST_ID: '7', BREVO_REPORT_TEMPLATE_ID: '3', REPORT_TEST_EMAIL: 'test@example.com' };
const post = (body, headers = {}) => new Request('https://www.tarmacsync.com/api/report-download', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://www.tarmacsync.com', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const call = async (request, env = ENV) => {
  const res = await reportDownload({ request, env });
  return { status: res.status, body: await res.json(), headers: res.headers };
};
const brevoCalls = [];
const stubBrevo = (contactStatus) => {
  brevoCalls.length = 0;
  globalThis.fetch = async (url, init = {}) => {
    brevoCalls.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });
    if ((init.method || 'GET') === 'GET') return new Response(contactStatus === 404 ? '{}' : JSON.stringify({ listIds: [] }), { status: contactStatus });
    return new Response('{}', { status: 201 });
  };
};
const valid = { email: 'Test@Example.com', airportOrganization: 'Example Regional Airport' };

await test('GET is refused with 405 and an Allow header', async () => {
  const r = await call(new Request('https://www.tarmacsync.com/api/report-download'));
  assert.equal(r.status, 405); assert.equal(r.headers.get('allow'), 'POST');
});
await test('a foreign origin is refused with 403', async () => {
  assert.equal((await call(post(valid, { origin: 'https://evil.example' }))).status, 403);
});
await test('a non-JSON body is refused with 400', async () => {
  assert.equal((await call(post('not json'))).status, 400);
});
await test('the honeypot field answers ok without sending anything', async () => {
  stubBrevo(404);
  const r = await call(post({ ...valid, website: 'http://spam' }));
  assert.equal(r.status, 200); assert.equal(brevoCalls.length, 0);
});
await test('while public delivery is off, only the allowlisted address may proceed', async () => {
  stubBrevo(404);
  assert.equal((await call(post({ ...valid, email: 'someone@else.com' }))).status, 403);
  assert.equal(brevoCalls.length, 0);
});
await test('missing Brevo configuration answers 503, never a silent success', async () => {
  assert.equal((await call(post(valid), { REPORT_TEST_EMAIL: 'test@example.com' })).status, 503);
});
await test('a new contact gets the template email, then is added to the report list', async () => {
  stubBrevo(404);
  const r = await call(post(valid));
  assert.equal(r.status, 200); assert.equal(r.body.delivery, 'email');
  assert.deepEqual(brevoCalls.map((c) => c.method + ' ' + new URL(c.url).pathname), ['GET /v3/contacts/test%40example.com', 'POST /v3/smtp/email', 'POST /v3/contacts']);
  assert.equal(brevoCalls[1].body.templateId, 3);
  assert.deepEqual(brevoCalls[2].body.listIds, [7]);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});
await test('the retired waitlist route answers 410', async () => {
  const res = await waitlist({ request: new Request('https://www.tarmacsync.com/api/waitlist', { method: 'POST' }), env: {} });
  assert.equal(res.status, 410);
});

if (failed) { console.error('\n' + failed + ' failing'); process.exit(1); }
console.log('\nfunctions checks passed');
