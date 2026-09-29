import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DietPlansService } from './diet-plans.service';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { UpdateDietPlanDto } from './dto/update-diet-plan.dto';
import { CloneTemplateDto } from './dto/clone-template.dto';
import { CreateDietTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('diet-plans')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class DietPlansController {
  constructor(private readonly dietPlansService: DietPlansService) {}

  /**
   * List all templates (Platform defaults + Gym specific)
   */
  @Get('templates/all')
  @Roles('TRAINER', 'GYM_STAFF', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async listTemplates(@CurrentGymId() gymId: string) {
    return this.dietPlansService.listTemplates(gymId);
  }

  /**
   * Create a gym-specific template (Owner/Manager view)
   */
  @Post('templates')
  @Roles('GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async createTemplate(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateDietTemplateDto,
  ) {
    return this.dietPlansService.createTemplate(gymId, dto);
  }

  /**
   * Clone a template into a new active plan for a specific member
   */
  @Post('clone')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async cloneTemplate(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CloneTemplateDto,
  ) {
    return this.dietPlansService.cloneFromTemplate(
      gymId,
      user.sub,
      user.role,
      dto,
    );
  }

  /**
   * Create a new diet plan from scratch
   */
  @Post()
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async createDietPlan(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDietPlanDto,
  ) {
    return this.dietPlansService.createDietPlan(
      gymId,
      user.sub,
      user.role,
      dto,
    );
  }

  /**
   * Update an existing diet plan
   */
  @Patch(':id')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async updateDietPlan(
    @CurrentGymId() gymId: string,
    @Param('id') planId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateDietPlanDto,
  ) {
    return this.dietPlansService.updateDietPlan(
      gymId,
      planId,
      user.sub,
      user.role,
      dto,
    );
  }

  /**
   * View a single diet plan by ID
   */
  @Get(':id')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async getDietPlanById(
    @CurrentGymId() gymId: string,
    @Param('id') planId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dietPlansService.getDietPlanById(
      gymId,
      planId,
      user.sub,
      user.role,
    );
  }

  /**
   * List all diet plans (history) for a member
   */
  @Get('member/:memberId')
  @Roles('TRAINER', 'GYM_OWNER', 'GYM_MANAGER', 'SUPER_ADMIN')
  async listMemberDietPlans(
    @CurrentGymId() gymId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dietPlansService.listMemberDietPlans(
      gymId,
      memberId,
      user.sub,
      user.role,
    );
  }
}
