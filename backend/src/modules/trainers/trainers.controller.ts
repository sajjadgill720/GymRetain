import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { RemoveTrainerDto } from './dto/remove-trainer.dto';
import { AssignTrainerDto } from './dto/assign-trainer.dto';
import { ReassignTrainerDto } from './dto/reassign-trainer.dto';
import { BulkAssignTrainerDto } from './dto/bulk-assign-trainer.dto';
import { UnassignMemberDto } from './dto/unassign-member.dto';
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
   * List all trainers with member counts
   */
  @Get()
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async listTrainers(
    @CurrentGymId() gymId: string,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.trainersService.listTrainers(gymId, {
      search,
      status,
      includeArchived: includeArchived === 'true',
    });
  }

  /**
   * Get unassigned members (available for coach assignment)
   */
  @Get('unassigned-members')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getUnassignedMembers(@CurrentGymId() gymId: string) {
    return this.trainersService.getUnassignedMembers(gymId);
  }

  /**
   * Create a new trainer profile (does NOT create a staff login account)
   */
  @Post()
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async createTrainer(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateTrainerDto,
  ) {
    return this.trainersService.createTrainer(gymId, dto);
  }

  /**
   * Assign a trainer to a member
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
   * Bulk assign members to a trainer
   */
  @Post('bulk-assign')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async bulkAssignMembers(
    @CurrentGymId() gymId: string,
    @Body() dto: BulkAssignTrainerDto,
  ) {
    return this.trainersService.bulkAssignMembers(gymId, dto);
  }

  /**
   * Reassign a member to a new trainer
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
   * Remove trainer assignment from a member
   */
  @Post('unassign')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async unassignMember(
    @CurrentGymId() gymId: string,
    @Body() dto: UnassignMemberDto,
  ) {
    return this.trainersService.unassignMember(gymId, dto.memberId);
  }

  /**
   * Deactivate a trainer assignment by assignment ID
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
   * Get single trainer details
   */
  @Get(':id')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getTrainer(
    @CurrentGymId() gymId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role === 'TRAINER' && user.sub !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.trainersService.getTrainer(gymId, id);
  }

  /**
   * Update trainer details
   */
  @Patch(':id')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async updateTrainer(
    @CurrentGymId() gymId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTrainerDto,
  ) {
    return this.trainersService.updateTrainer(gymId, id, dto);
  }

  /**
   * Remove trainer with reassignment or unassign confirmation and archiving
   */
  @Delete(':id')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async removeTrainer(
    @CurrentGymId() gymId: string,
    @Param('id') id: string,
    @Body() dto?: RemoveTrainerDto,
  ) {
    return this.trainersService.removeTrainer(gymId, id, dto);
  }

  /**
   * View members assigned to a specific trainer
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
