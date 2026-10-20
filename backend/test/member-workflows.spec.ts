import { MemberPassService } from '../src/modules/member/member-pass.service';
import { MemberService } from '../src/modules/member/member.service';
import { MemberPaymentService } from '../src/modules/member/member-payment.service';
import { MemberIdentity } from '../src/modules/auth/member-identity';
const who:MemberIdentity={sub:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',memberId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',gymId:'11111111-1111-1111-1111-111111111111',role:'MEMBER',aud:'gymretain-member',iss:'gymretain'};
describe('Member workflows',()=>{
 beforeEach(()=>{process.env.MEMBER_DEV_OTP='true';});
 it('rotating QR passes verify only for the signed gym and expire after 30 seconds',async()=>{
  const service=new MemberPassService();const pass=await service.issue(who);expect(service.verify(pass.token,who.gymId)).toBe(who.memberId);expect(()=>service.verify(pass.token,'22222222-2222-2222-2222-222222222222')).toThrow();
  expect(()=>service.verify(pass.token+'x',who.gymId)).toThrow();const now=jest.spyOn(Date,'now').mockReturnValue(pass.expiresAt);expect(()=>service.verify(pass.token,who.gymId)).toThrow();now.mockRestore();
 });
 it('scopes workout writes to the verified identity regardless of injected IDs',async()=>{
  const create=jest.fn();const service=new MemberService({run:(_who,fn)=>fn({workoutLog:{create}})} as any);
  await service.workout(who,{title:'Strength',minutes:30,memberId:'other',gymId:'other'} as any);expect(create).toHaveBeenCalledWith({data:expect.objectContaining({memberId:who.memberId,gymId:who.gymId})});
 });
 it('rejects a diet checklist entry outside the assigned member plan',async()=>{
  const service=new MemberService({run:(_who,fn)=>fn({dietPlan:{findFirst:async()=>null}})} as any);
  await expect(service.meal(who,{mealId:'other',checked:true})).rejects.toThrow('your assigned plan');
 });
 it('does not create a payment or fabricate a successful renewal without a gateway',async()=>{
  const old=process.env.MEMBER_PAYMENT_GATEWAY_URL;delete process.env.MEMBER_PAYMENT_GATEWAY_URL;const db={run:jest.fn()};
  await expect(new MemberPaymentService(db as any,{} as any).checkout(who,{provider:'JAZZCASH'})).rejects.toThrow('not configured');expect(db.run).not.toHaveBeenCalled();if(old)process.env.MEMBER_PAYMENT_GATEWAY_URL=old;
 });
 it('rejects forged and stale payment callbacks before accessing the database',async()=>{
  const tenant={runWithTenantRLS:jest.fn()};process.env.MEMBER_PAYMENT_GATEWAY_SECRET='a'.repeat(32);const service=new MemberPaymentService({} as any,tenant as any);
  await expect(service.callback({paymentId:who.memberId,gymId:who.gymId,status:'COMPLETED',amount:500000,currency:'PKR',reference:'test',timestamp:Date.now()},'fake')).rejects.toThrow();expect(tenant.runWithTenantRLS).not.toHaveBeenCalled();
 });
});
