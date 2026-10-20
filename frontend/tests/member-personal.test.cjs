const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function tracker() {
  const values = new Map(); const exports = {};
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/member-personal.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, localStorage: storage, crypto: require('node:crypto').webcrypto, Intl, Date });
  return { api: exports, values };
}
test('personal workout, records, measurements and goals persist without a gym account', async () => {
  const { api } = tracker();
  await api.personalRequest('/member/workouts', { method: 'POST', body: JSON.stringify({ title: 'Home strength', minutes: 35 }) });
  await api.personalRequest('/member/records', { method: 'POST', body: JSON.stringify({ exercise: 'Squat', weightKg: 30, reps: 8 }) });
  await api.personalRequest('/member/measurements', { method: 'POST', body: JSON.stringify({ weightKg: 75 }) });
  await api.personalRequest('/member/profile', { method: 'PATCH', body: JSON.stringify({ firstName: 'Ali', weeklyTarget: 4 }) });
  const data = await api.personalRequest('/member/overview');
  assert.equal(data.workouts[0].title, 'Home strength'); assert.equal(data.weeklyVisits, 1);
  assert.equal(data.records.length, 1); assert.equal(data.measurements.length, 1); assert.equal(data.profile.weeklyTarget, 4);
  assert.equal(data.membership, null); assert.equal(data.classes.length, 0);
});
test('personal backups move devices and invalid imports preserve existing data', async () => {
  const first = tracker().api; const second = tracker().api;
  await first.personalRequest('/member/workouts', { method: 'POST', body: JSON.stringify({ title: 'New gym', minutes: 45 }) });
  second.importPersonal(first.exportPersonal()); assert.equal(second.personalOverview().workouts[0].title, 'New gym');
  const before = second.exportPersonal();
  assert.throws(() => second.importPersonal('{"version":9}'), /backup/);
  assert.equal(second.exportPersonal(), before);
  await assert.rejects(second.personalRequest('/member/workouts', { method: 'POST', body: JSON.stringify({ title: 'Invalid', minutes: -2 }) }));
  assert.equal(second.exportPersonal(), before);
});
test('taking gym history into personal mode is idempotent and unsupported gym actions fail', async () => {
  const { api } = tracker(); const overview = api.personalOverview();
  overview.workouts = [{ id: 'existing-session', title: 'Strength', minutes: 30, loggedAt: new Date().toISOString() }];
  api.takeTrainingWithMe(overview); api.takeTrainingWithMe(overview);
  assert.equal(api.personalOverview().workouts.length, 1);
  await assert.rejects(api.personalRequest('/member/classes/123/book', { method: 'POST' }), /connected gym/);
  assert.equal(api.personalOverview().workouts.length, 1);
});
