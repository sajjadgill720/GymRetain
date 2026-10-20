import { JwtService } from '@nestjs/jwt';
import { MemberAuthService } from '../src/modules/auth/member-auth.service';
import { assertMember, digest, normalizePhone } from '../src/modules/auth/member-identity';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { MemberPrismaService } from '../src/prisma/member-prisma.service';

describe('Member passwordless authentication',()=>{
  const gymId='11111111-1111-1111-1111-111111111111';
  const memberId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  let service:MemberAuthService;let tx:any;let otp:any;let token:any;
  beforeEach(()=>{
    process.env.MEMBER_DEV_OTP='true';
    otp={id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',gymId,memberId,attempts:0,expiresAt:new Date(Date.now()+300000),consumedAt:null,codeHash:''};otp.codeHash=digest(`${otp.id}:123456`);
    tx={$executeRaw:jest.fn(),memberOtp:{findFirst:jest.fn(()=>({...otp})),update:jest.fn(async({data})=>{if(data.attempts)otp.attempts++;if(data.consumedAt)otp.consumedAt=data.consumedAt;return otp;})},member:{findFirst:jest.fn(async()=>({id:memberId,firstName:'Ali',lastName:'Khan'}))}};
    token=jest.fn(()=> 'member-token');
    service=new MemberAuthService({} as any,{runWithTenantRLS:jest.fn((_gym,fn)=>fn(tx))} as any,{sign:token} as any);
    jest.spyOn(service,'publicGym').mockResolvedValue({id:gymId,name:'Test',slug:'test-gym',timezone:'Asia/Karachi'});
    jest.spyOn(service,'limit').mockResolvedValue(undefined);
  });
  const dto=()=>({gymSlug:'test-gym',requestId:otp.id,code:'123456'});
  it('normalizes Pakistan mobile numbers and rejects malformed numbers',()=>{
    expect(normalizePhone('0300 1234567')).toBe('+923001234567');expect(()=>normalizePhone('abc')).toThrow();
  });
  it('issues a separate member JWT with audience, expiry and only verified IDs',async()=>{
    const result=await service.verify(dto(),'ip');expect(result.token).toBe('member-token');
    expect(token).toHaveBeenCalledWith(expect.objectContaining({role:'MEMBER',memberId,gymId,sub:memberId}),expect.objectContaining({audience:'gymretain-member',expiresIn:'12h'}));
  });
  it('consumes codes atomically and rejects replay',async()=>{
    await service.verify(dto(),'ip');await expect(service.verify(dto(),'ip')).rejects.toThrow('invalid or expired');expect(token).toHaveBeenCalledTimes(1);
  });
  it('commits failed attempts and locks out after five guesses',async()=>{
    for(let i=0;i<5;i++)await expect(service.verify({...dto(),code:'654321'},'ip')).rejects.toThrow();
    expect(otp.attempts).toBe(5);await expect(service.verify(dto(),'ip')).rejects.toThrow();expect(token).not.toHaveBeenCalled();
  });
  it('rejects expired codes and unknown members without issuing a token',async()=>{
    otp.expiresAt=new Date(Date.now()-1);await expect(service.verify(dto(),'ip')).rejects.toThrow();
    otp.expiresAt=new Date(Date.now()+300000);otp.memberId=null;await expect(service.verify(dto(),'ip')).rejects.toThrow();
  });
  it('rejects member claims on staff authentication even with a staff signing key',async()=>{
    const db={gymStaff:{findUnique:jest.fn()}};const strategy=new JwtStrategy(db as any);
    await expect(strategy.validate({sub:memberId,role:'MEMBER'} as any)).rejects.toThrow('cannot access staff');expect(db.gymStaff.findUnique).not.toHaveBeenCalled();
  });
  it('rejects mixed identities before opening a member transaction',()=>{
    expect(()=>assertMember({sub:memberId,memberId:'cccccccc-cccc-cccc-cccc-cccccccccccc',gymId,role:'MEMBER',aud:'gymretain-member',iss:'gymretain'})).toThrow();
  });
  it('sets the member RLS session from verified claims in the same transaction',async()=>{
    const execute=jest.fn();const tenant={runWithTenantRLS:jest.fn((_gym,fn)=>fn({$executeRaw:execute}))};
    const db=new MemberPrismaService(tenant as any);await db.run({sub:memberId,memberId,gymId,role:'MEMBER',aud:'gymretain-member',iss:'gymretain'},async()=>true);
    expect(tenant.runWithTenantRLS).toHaveBeenCalledWith(gymId,expect.any(Function));expect(execute.mock.calls[0][1]).toBe(memberId);
  });
  it('enforces shared-database request limits across service calls',async()=>{
    let count=0;const svc=new MemberAuthService({} as any,{runWithTenantRLS:(_gym,fn)=>fn({portalRateLimit:{upsert:async()=>({count:++count})}})} as any,new JwtService());
    await svc.limit(gymId,'phone:test',1,900000);await expect(svc.limit(gymId,'phone:test',1,900000)).rejects.toMatchObject({status:429});
  });
});
