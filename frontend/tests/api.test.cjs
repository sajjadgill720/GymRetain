const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/api.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function client(fetch) {
  const operations = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/operations.ts'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, {exports:operations,Intl,crypto:require('node:crypto').webcrypto});
  const context = { exports: {}, process: { env: {} }, fetch, URLSearchParams, console, setTimeout, require: name => {if(name==='./operations') return operations; throw new Error(`Unexpected import ${name}`);} };
  vm.runInNewContext(compiled, context);
  return context.exports.api;
}
const ok = data => ({ ok: true, json: async () => ({ data }) });
test('authenticated reads and writes propagate service failures', async () => {
  const api=client(async()=>{throw new Error('database unavailable');});
  api.setToken('test-token');
  for(const action of [()=>api.getDashboardSummary(),()=>api.getMembers(),()=>api.getSubscriptions(),()=>api.getPaymentRecords(),()=>api.createDietPlan({title:'Plan'}),()=>api.getOperations(),()=>api.mutateOperations({kind:'tasks',action:'create',version:0,data:{}})]) await assert.rejects(action(),/database unavailable/);
});
test('capacity uses existing gym update route and maps admission policy', async () => {
  let call;
  const api = client(async (url, options) => { call = { url, options }; return ok({ capacity: 75 }); });
  await api.updateCapacity({ capacity: 75, capacityPolicy: 'BLOCK_AT_CAPACITY' });
  assert.equal(call.url, 'http://localhost:4000/api/v1/gyms/my-gym');
  assert.equal(call.options.method, 'PATCH');
  assert.deepEqual(JSON.parse(call.options.body), { capacity: 75, capacityPolicy: 'BLOCK_ADMISSION' });
});
test('capacity and follow-up failures propagate instead of reporting success', async () => {
  const api = client(async () => ({ ok: false, status: 403, json: async () => ({ message: 'Owner access required' }) }));
  await assert.rejects(api.updateCapacity({ capacity: 75 }), /Owner access required/);
  await assert.rejects(api.recordRetentionIntervention({ memberId: 'member-1', outreachMethod: 'WHATSAPP' }), /Owner access required/);
});
test('WhatsApp preview sends phone and keyword and unwraps response envelope', async () => {
  let body;
  const api = client(async (url, options) => { assert.match(url, /messaging\/whatsapp\/simulate$/); body = JSON.parse(options.body); return ok({ reply: 'Your streak is 5 days' }); });
  const result = await api.previewWhatsAppReply({ phone: '+923001234567', message: 'STREAK', gymId: 'gym-1' });
  assert.deepEqual(body, { phone: '+923001234567', message: 'STREAK', gymId: 'gym-1' });
  assert.equal(result.reply, 'Your streak is 5 days');
});
test('WhatsApp preview does not fabricate a reply when API fails', async () => {
  const api = client(async () => { throw new Error('API offline'); });
  await assert.rejects(api.previewWhatsAppReply({ phone: '+923001234567', message: 'HELP' }), /API offline/);
});
test('member search encodes identifiers and preserves returned members', async () => {
  const api = client(async url => { assert.match(url, /\/members\?search=GR-1001/); return ok({ members: [{ id: 'member-1' }], meta: { total: 1 } }); });
  const result = await api.getMembers({ search: 'GR-1001' });
  assert.equal(result.members[0].id, 'member-1');
});
test('dashboard explicitly marks fallback data and clears flag after recovery', async () => {
  let offline = true;
  const api = client(async () => { if (offline) throw new Error('offline'); return ok({ kpis: { activeMembers: 7 } }); });
  await api.getDashboardSummary();
  assert.equal(api.dashboardUsesDemoData, true);
  offline = false;
  assert.equal((await api.getDashboardSummary()).kpis.activeMembers, 7);
  assert.equal(api.dashboardUsesDemoData, false);
});
test('capacity status normalizes backend occupancy fields and strict policy', async () => {
  const api = client(async () => ok({ currentOccupancy: 24, capacity: 80, capacityPolicy: 'BLOCK_ADMISSION', utilizationPercent: 30 }));
  const result = await api.getCapacityStatus();
  assert.equal(result.currentlyCheckedIn, 24);
  assert.equal(result.capacityUsagePercent, 30);
  assert.equal(result.remainingCapacity, 56);
  assert.equal(result.capacityPolicy, 'BLOCK_AT_CAPACITY');
});
