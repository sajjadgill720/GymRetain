import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';
import { memberSecret, MemberIdentity } from '../auth/member-identity';

@Injectable()
export class MemberPassService {
  async issue(identity:MemberIdentity) {
    const expiresAt=(Math.floor(Date.now()/30_000)+1)*30_000;
    const payload=Buffer.from(JSON.stringify({gymId:identity.gymId,memberId:identity.memberId,expiresAt})).toString('base64url');
    const signature=createHmac('sha256',memberSecret('PASS')).update(payload).digest('base64url');
    const token=`grm.${payload}.${signature}`;
    const qrPayload=JSON.stringify({type:'MEMBER_PASS',token});
    return {token,qrPayload,expiresAt,qrImage:await QRCode.toDataURL(qrPayload,{width:360,margin:3,errorCorrectionLevel:'M',color:{dark:'#24392E',light:'#FFFEFA'}})};
  }
  verify(token:string,gymId:string):string {
    try {
      const [prefix,payload,signature,...rest]=token.split('.');
      if(prefix!=='grm'||rest.length)throw new Error();
      const expected=createHmac('sha256',memberSecret('PASS')).update(payload).digest();const actual=Buffer.from(signature,'base64url');
      if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error();
      const value=JSON.parse(Buffer.from(payload,'base64url').toString());
      if(value.gymId!==gymId||!value.memberId||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=Date.now()||value.expiresAt>Date.now()+30_000)throw new Error();
      return value.memberId;
    } catch { throw new ForbiddenException('Member pass is expired, invalid, or belongs to another gym'); }
  }
}
