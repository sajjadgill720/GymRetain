const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {PGlite}=require('@electric-sql/pglite');
let db;
const a='11111111-1111-1111-1111-111111111111',b='22222222-2222-2222-2222-222222222222';
const alice='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',amy='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',bob='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
const session='cccccccc-cccc-cccc-cccc-ccccccccccc1';
async function asMember(gym,member,fn,role='portal_runtime') {
 assert.ok(['portal_runtime','gymretain_member_runtime'].includes(role));
 await db.exec(`BEGIN; SET LOCAL ROLE ${role};`);
 try {await db.query("SELECT set_config('app.current_gym_id',$1,true),set_config('app.current_member_id',$2,true),set_config('app.is_super_admin','false',true)",[gym,member]);const result=await fn();await db.exec('COMMIT');return result;}catch(error){await db.exec('ROLLBACK');throw error;}
}
before(async()=>{
 db=new PGlite();
 const sql=execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script'],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
 await db.exec(sql);
 // Existing installations already have these policies. Apply their exact source here.
 const migrations=path.join(__dirname,'../prisma/migrations');
 for(const folder of fs.readdirSync(migrations).filter(n=>n<'20261020000000')) {
  const source=fs.readFileSync(path.join(migrations,folder,'migration.sql'),'utf8');
  const statements=source.match(/ALTER TABLE "\w+" (?:ENABLE|FORCE) ROW LEVEL SECURITY;|DROP POLICY[\s\S]*?;|CREATE POLICY[\s\S]*?;/g)||[];
  for(const statement of statements)await db.exec(statement);
 }
 const auth=fs.readFileSync(path.join(migrations,'20261020000000_member_auth/migration.sql'),'utf8');
 await db.exec(auth.slice(auth.indexOf('ALTER TABLE "member_otps" ENABLE')));
 await db.exec(fs.readFileSync(path.join(migrations,'20261020011000_member_portal_security/migration.sql'),'utf8'));
 const eventSql=fs.readFileSync(path.join(migrations,'20261020020000_portal_events/migration.sql'),'utf8');await db.exec(eventSql.slice(eventSql.indexOf('ALTER TABLE portal_events ENABLE')));
 await db.exec(fs.readFileSync(path.join(migrations,'20261020021000_member_runtime_role/migration.sql'),'utf8'));
 await db.exec("CREATE ROLE portal_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS; GRANT USAGE ON SCHEMA public TO portal_runtime; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO portal_runtime; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO portal_runtime;");
 for(const [id,name] of [[a,'Gym A'],[b,'Gym B']])await db.query('INSERT INTO gyms(id,name,slug,phone,"qrCodeSecret",updated_at) VALUES($1,$2,$3,$4,$5,now())',[id,name,id,'+923001234567',id]);
 for(const [id,gym,name] of [[alice,a,'Alice'],[amy,a,'Amy'],[bob,b,'Bob']]) {
  await db.query('INSERT INTO members(id,gym_id,member_code,first_name,last_name,phone,updated_at) VALUES($1,$2,$3,$4,\'Member\',$5,now())',[id,gym,name,name,'+923001234567']);
  await db.query('INSERT INTO workout_logs(id,gym_id,member_id,title,minutes) VALUES($1,$2,$1,$3,30)',[id,gym,`${name} workout`]);
  await db.query("INSERT INTO memberships(id,gym_id,member_id,plan_name,price,start_date,end_date,updated_at) VALUES($1,$2,$1,'Monthly',500000,current_date,current_date+30,now())",[id,gym]);
  await db.query("INSERT INTO check_ins(id,gym_id,member_id,check_in_date) VALUES($1,$2,$1,current_date)",[id,gym]);
 }
 const settings={operations:{version:0,leads:[],tasks:[],expenses:[],sessions:[{id:session,title:'Strength',coach:'Coach',startsAt:new Date(Date.now()+86400000).toISOString(),duration:60,capacity:1,attendees:[],status:'SCHEDULED'}]}};
 await db.query('UPDATE gyms SET settings=$1::jsonb WHERE id=$2',[JSON.stringify(settings),a]);
});
after(async()=>{await db?.close();});
test('member SELECT is restricted to self, including other members in the same gym',async()=>{
 await asMember(a,alice,async()=>{for(const table of ['members','memberships','workout_logs','check_ins']){const rows=await db.query(`SELECT id FROM ${table}`);assert.deepEqual(rows.rows.map(r=>r.id),[alice]);}});
});
test('member UPDATE cannot modify another member or another gym',async()=>{
 await asMember(a,alice,async()=>{const result=await db.query("UPDATE workout_logs SET title='Changed' RETURNING member_id");assert.deepEqual(result.rows.map(r=>r.member_id),[alice]);});
});
test('forged ownership INSERT is rejected by PostgreSQL',async()=>{
 await assert.rejects(()=>asMember(a,alice,()=>db.query("INSERT INTO workout_logs(id,gym_id,member_id,title,minutes) VALUES(gen_random_uuid(),$1,$2,'Forged',30)",[a,amy])),/row-level security/);
 await assert.rejects(()=>asMember(a,alice,()=>db.query("INSERT INTO workout_logs(id,gym_id,member_id,title,minutes) VALUES(gen_random_uuid(),$1,$2,'Forged',30)",[b,bob])),/row-level security/);
});
test('members cannot publish announcements or access staff identities',async()=>{
 await assert.rejects(()=>asMember(a,alice,()=>db.query("INSERT INTO announcements(id,gym_id,title,body) VALUES(gen_random_uuid(),$1,'Fake','Fake')",[a])),/row-level security/);
 await asMember(a,alice,async()=>assert.equal((await db.query('SELECT * FROM gym_staff')).rows.length,0));
});
test('occupancy exposes only a count and refuses a different gym',async()=>{
 await asMember(a,alice,async()=>assert.equal((await db.query('SELECT portal_occupancy($1) AS count',[a])).rows[0].count,2));
 await assert.rejects(()=>asMember(a,alice,()=>db.query('SELECT portal_occupancy($1)',[b])),/Tenant mismatch/);
});
test('booking is idempotent, enforces capacity and waitlists the next member',async()=>{
 const book=(member)=>asMember(a,member,()=>db.query('SELECT * FROM portal_book_class($1,$2,$3,false)',[a,member,session]));
 assert.equal((await book(alice)).rows[0].booking_status,'BOOKED');assert.equal((await book(alice)).rows[0].booking_status,'BOOKED');
 assert.equal((await book(amy)).rows[0].booking_status,'WAITLISTED');
 const rows=await db.query('SELECT status FROM class_bookings WHERE gym_id=$1',[a]);assert.equal(rows.rows.length,2);assert.equal(rows.rows.filter(r=>r.status==='BOOKED').length,1);
});
test('booking function rejects another member and another gym',async()=>{
 await assert.rejects(()=>asMember(a,alice,()=>db.query('SELECT * FROM portal_book_class($1,$2,$3,false)',[a,amy,session])),/Identity mismatch/);
 await assert.rejects(()=>asMember(a,alice,()=>db.query('SELECT * FROM portal_book_class($1,$2,$3,false)',[b,bob,session])),/Identity mismatch/);
});
test('cancellation promotes the waitlist and updates the owner Operations schedule',async()=>{
 await asMember(a,alice,()=>db.query('SELECT * FROM portal_book_class($1,$2,$3,true)',[a,alice,session]));
 const row=(await db.query('SELECT settings FROM gyms WHERE id=$1',[a])).rows[0];assert.deepEqual(row.settings.operations.sessions[0].attendees,['Amy Member (Amy)']);
 await asMember(a,alice,async()=>assert.equal((await db.query('SELECT * FROM class_bookings WHERE member_id=$1',[amy])).rows.length,0));
});
test('transaction-local identity resets and unscoped runtime reads return zero rows',async()=>{
 await db.exec('BEGIN; SET LOCAL ROLE portal_runtime;');
 try{assert.equal((await db.query('SELECT * FROM workout_logs')).rows.length,0);}finally{await db.exec('ROLLBACK');}
});
test('event outbox is atomic and never reveals another member’s private events',async()=>{
 await asMember(a,alice,async()=>{const rows=await db.query('SELECT member_id FROM portal_events');assert.ok(rows.rows.length>0);assert.ok(rows.rows.every(row=>row.member_id===null||row.member_id===alice));});
 const before=(await db.query('SELECT count(*)::int AS count FROM portal_events')).rows[0].count;
 await db.exec('BEGIN');await db.query("UPDATE workout_logs SET title='Uncommitted' WHERE member_id=$1",[alice]);await db.exec('ROLLBACK');
 assert.equal((await db.query('SELECT count(*)::int AS count FROM portal_events')).rows[0].count,before);
});
test('the actual member runtime role enforces self isolation even from an administrator connection',async()=>{
 await asMember(a,alice,async()=>{const rows=await db.query('SELECT id FROM members');assert.deepEqual(rows.rows.map(r=>r.id),[alice]);assert.equal((await db.query('SELECT portal_class_schedule($1) AS sessions',[a])).rows[0].sessions.length,1);},'gymretain_member_runtime');
 await assert.rejects(()=>asMember(a,alice,()=>db.query('SELECT settings FROM gyms'),'gymretain_member_runtime'),/permission denied/);
 await assert.rejects(()=>asMember(a,alice,()=>db.query('SELECT * FROM member_otps'),'gymretain_member_runtime'),/permission denied/);
});
test('members cannot fabricate completed payments at the database layer',async()=>{
 await assert.rejects(()=>asMember(a,alice,()=>db.query("INSERT INTO payments(id,gym_id,member_id,amount,status,updated_at) VALUES(gen_random_uuid(),$1,$2,500000,'COMPLETED',now())",[a,alice]),'gymretain_member_runtime'),/row-level security/);
});
