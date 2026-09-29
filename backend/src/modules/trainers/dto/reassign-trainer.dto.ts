import { IsUUID, IsNotEmpty } from 'class-validator';

export class ReassignTrainerDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsUUID()
  @IsNotEmpty()
  newTrainerId: string;
}
