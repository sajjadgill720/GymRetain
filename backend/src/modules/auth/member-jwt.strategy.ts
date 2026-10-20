import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { MemberPrismaService } from '../../prisma/member-prisma.service';
import { assertMember, MemberIdentity, memberSecret } from './member-identity';

@Injectable()
export class MemberJwtStrategy extends PassportStrategy(Strategy,'member-jwt') {
  constructor(private readonly db:MemberPrismaService) {
    super({jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),secretOrKeyProvider:(_req,_token,done)=>{try{done(null,memberSecret('JWT'));}catch(error){done(error,null);}},ignoreExpiration:false,audience:'gymretain-member',issuer:'gymretain'});
  }
  async validate(payload:MemberIdentity) {
    assertMember(payload);
    const member=await this.db.run(payload,tx=>tx.member.findFirst({where:{id:payload.memberId,gymId:payload.gymId},select:{id:true,gym:{select:{status:true}}}}));
    if(!member||member.gym.status==='SUSPENDED')throw new UnauthorizedException('Member session unavailable');
    return payload;
  }
}
