import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignTrainerDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  trainerId: string;
}
