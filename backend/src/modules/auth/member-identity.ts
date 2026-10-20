import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export interface MemberIdentity { sub:string; memberId:string; gymId:string; role:'MEMBER'; aud:'gymretain-member'; iss:'gymretain'; }
export function memberSecret(kind:'JWT'|'OTP'|'PASS') {
  const secret=process.env[`MEMBER_${kind}_SECRET`];
  if(secret && secret.length>=32)return secret;
  if(process.env.NODE_ENV==='production' || process.env.MEMBER_DEV_OTP!=='true')throw new Error(`MEMBER_${kind}_SECRET must contain at least 32 characters`);
  return `local-development-only-member-${kind}-secret-change-before-deploy`;
}
export function normalizePhone(phone:string) {
  let value=phone.replace(/[\s()-]/g,'');
  if(/^03\d{9}$/.test(value))value='+92'+value.slice(1);
  if(!/^\+[1-9]\d{7,14}$/.test(value))throw new BadRequestException('Use a valid phone number with country code');
  return value;
}
export function digest(value:string) { return createHmac('sha256',memberSecret('OTP')).update(value).digest('hex'); }
export function sameDigest(left:string,right:string) { return left.length===right.length && timingSafeEqual(Buffer.from(left),Buffer.from(right)); }
export function assertMember(value:Partial<MemberIdentity>):asserts value is MemberIdentity {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(value.role!=='MEMBER'||value.aud!=='gymretain-member'||value.iss!=='gymretain'||value.sub!==value.memberId||!uuid.test(value.memberId||'')||!uuid.test(value.gymId||''))throw new UnauthorizedException('Invalid member session');
}
