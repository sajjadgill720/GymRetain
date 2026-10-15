const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");
const domain = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib/operations.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  { exports: domain, Intl, crypto: require("node:crypto").webcrypto },
);
const session = {
  title: "Strength",
  coach: "Ayesha",
  startsAt: "2026-10-16T12:00:00Z",
  duration: 60,
  capacity: 1,
  attendees: ["Ali"],
  status: "SCHEDULED",
};
test('money preserves recorded paisa without rounding to whole rupees',()=>{
  assert.equal(domain.money(125050),'Rs 1,250.5');
});
test("demo edits are versioned, immutable and reject stale writes", () => {
  const state = domain.emptyOperations();
  const next = domain.applyDemoOperation(state, {
    kind: "sessions",
    action: "create",
    version: 0,
    data: session,
  });
  assert.equal(state.sessions.length, 0);
  assert.equal(next.version, 1);
  assert.equal(next.sessions.length, 1);
  assert.throws(
    () =>
      domain.applyDemoOperation(next, {
        kind: "tasks",
        action: "create",
        version: 0,
        data: {},
      }),
    /changed/,
  );
});
test("bookings reject capacity overflow and duplicates without losing saved data", () => {
  const state = domain.applyDemoOperation(domain.emptyOperations(), {
    kind: "sessions",
    action: "create",
    version: 0,
    data: session,
  });
  for (const data of [
    { attendees: ["Ali", "Sara"] },
    { capacity: 3, attendees: ["Ali", " ali "] },
  ])
    assert.throws(
      () =>
        domain.applyDemoOperation(state, {
          kind: "sessions",
          action: "update",
          id: state.sessions[0].id,
          version: 1,
          data,
        }),
      /capacity|duplicate/,
    );
  assert.equal(state.sessions[0].attendees.length, 1);
});
test("coach conflicts are rejected but adjacent sessions are allowed", () => {
  const state = domain.applyDemoOperation(domain.emptyOperations(), {
    kind: "sessions",
    action: "create",
    version: 0,
    data: session,
  });
  assert.throws(
    () =>
      domain.applyDemoOperation(state, {
        kind: "sessions",
        action: "create",
        version: 1,
        data: {
          ...session,
          coach: " ayesha ",
          startsAt: "2026-10-16T12:30:00Z",
        },
      }),
    /already has/,
  );
  assert.equal(
    domain.applyDemoOperation(state, {
      kind: "sessions",
      action: "create",
      version: 1,
      data: { ...session, startsAt: "2026-10-16T13:00:00Z" },
    }).sessions.length,
    2,
  );
});
test("exports escape commas, quotes, newlines and spreadsheet formula injection", () => {
  const csv = domain.csvDocument(
    ["Name", "Notes"],
    [
      ["A, B", 'He said "hello"\nagain'],
      ["=SUM(A1)", " +CMD"],
    ],
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"A, B"'));
  assert.ok(csv.includes('"He said ""hello""\nagain"'));
  assert.ok(csv.includes('"\'=SUM(A1)"'));
  assert.ok(csv.includes('"\' +CMD"'));
});
test("calendar dates follow the gym timezone at midnight boundaries", () => {
  assert.equal(
    domain.localDate(new Date("2026-10-15T20:00:00Z"), "Asia/Karachi"),
    "2026-10-16",
  );
});
