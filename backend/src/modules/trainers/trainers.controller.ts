import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { AssignTrainerDto } from './dto/assign-trainer.dto';
import { ReassignTrainerDto } from './dto/reassign-trainer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('trainers')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  /**
   * List all trainers with member counts (Owner/Manager view)
   */
  @Get()
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async listTrainers(@CurrentGymId() gymId: string) {
    return this.trainersService.listTrainers(gymId);
  }

  /**
   * Assign a trainer to a member (Owner/Manager only - no self-assignment)
   */
  @Post('assign')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async assignTrainer(
    @CurrentGymId() gymId: string,
    @Body() dto: AssignTrainerDto,
  ) {
    return this.trainersService.assignTrainer(gymId, dto);
  }

  /**
   * Reassign a member to a new trainer (Owner/Manager only)
   */
  @Post('reassign')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async reassignTrainer(
    @CurrentGymId() gymId: string,
    @Body() dto: ReassignTrainerDto,
  ) {
    return this.trainersService.reassignTrainer(gymId, dto);
  }

  /**
   * Deactivate a trainer assignment
   */
  @Patch('assignments/:id/deactivate')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async deactivateAssignment(
    @CurrentGymId() gymId: string,
    @Param('id') assignmentId: string,
  ) {
    return this.trainersService.deactivateAssignment(gymId, assignmentId);
  }

  /**
   * Dedicated endpoint for the currently logged-in trainer to view their assigned members
   */
  @Get('my-members')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getMyAssignedMembers(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trainersService.getAssignedMembers(gymId, user.sub);
  }

  /**
   * View members assigned to a specific trainer
   * Trainers can only view their own; Owners/Managers can view any trainer's assigned members
   */
  @Get(':trainerId/members')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getTrainerAssignedMembers(
    @CurrentGymId() gymId: string,
    @Param('trainerId') trainerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role === 'TRAINER' && user.sub !== trainerId) {
      throw new ForbiddenException(
        'Access denied: Trainers can only view their own assigned members',
      );
    }
    return this.trainersService.getAssignedMembers(gymId, trainerId);
  }

  /**
   * View assignment history for a member
   */
  @Get('members/:memberId/history')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getMemberAssignments(
    @CurrentGymId() gymId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // If trainer, verify this member is or was assigned to them
    if (user.role === 'TRAINER') {
      const history = await this.trainersService.getMemberAssignments(gymId, memberId);
      const isAssigned = history.some((h) => h.trainerId === user.sub);
      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied: You are not assigned to this member',
        );
      }
      return history;
    }

    return this.trainersService.getMemberAssignments(gymId, memberId);
  }
}
