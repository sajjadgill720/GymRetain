import { IsUUID, IsNotEmpty } from 'class-validator';

export class UnassignMemberDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;
}
