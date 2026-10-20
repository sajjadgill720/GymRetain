const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/member-navigation.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsObject, URL });

test('member shortcuts retain preview alongside an existing action and fragment', () => {
  assert.equal(exportsObject.memberHref('/portal/progress?log=workout#journal', true), '/portal/progress?log=workout&preview=1#journal');
  assert.equal(exportsObject.memberHref('/portal/progress?log=workout', false), '/portal/progress?log=workout');
  assert.equal(exportsObject.memberHref('/portal?preview=1', true), '/portal?preview=1');
});

test('class and detail routes retain a useful parent navigation destination', () => {
  assert.equal(exportsObject.memberNavSection('/portal/classes'), 'workouts');
  assert.equal(exportsObject.memberNavSection('/portal/diet'), 'account');
  assert.equal(exportsObject.memberNavSection('/portal'), 'home');
});

test('crowd meter distinguishes missing capacity and clamps overflow without claiming spare room', () => {
  assert.equal(exportsObject.crowdStatus(12, 0).label, 'Capacity unavailable');
  assert.equal(exportsObject.crowdStatus(81, 100).label, 'Getting busy');
  assert.equal(exportsObject.crowdStatus(120, 100).label, 'At capacity');
  assert.equal(exportsObject.crowdStatus(120, 100).fraction, 1);
  assert.equal(exportsObject.crowdStatus(-1, 100).fraction, 0);
});
