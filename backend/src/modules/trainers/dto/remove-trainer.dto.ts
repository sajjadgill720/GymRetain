import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class RemoveTrainerDto {
  @IsUUID()
  @IsOptional()
  reassignTrainerId?: string;

  @IsBoolean()
  @IsOptional()
  unassignMembers?: boolean;
}
