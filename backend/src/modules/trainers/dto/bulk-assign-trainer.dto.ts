import { IsUUID, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class BulkAssignTrainerDto {
  @IsUUID()
  @IsNotEmpty()
  trainerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberIds: string[];
}
