import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { OwnerSignupDto } from './dto/owner-signup.dto';
import { LoginDto } from './dto/login.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup-owner')
  async signupOwner(@Body() dto: OwnerSignupDto) {
    return this.authService.signupOwner(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user);
  }

  @Post('switch-gym')
  @HttpCode(HttpStatus.OK)
  async switchGym(
    @Req() req: any,
    @Body('gymId') gymId: string,
  ) {
    return this.authService.switchGym(req.user, gymId);
  }

  @Post('invite-staff')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async inviteStaff(
    @CurrentGymId() gymId: string,
    @Req() req: any,
    @Body() dto: InviteStaffDto,
  ) {
    return this.authService.inviteStaff(gymId, dto, req.user?.sub);
  }

  @Get('staff')
  @UseGuards(TenantAccessGuard)
  async listStaff(@CurrentGymId() gymId: string) {
    return this.authService.listStaff(gymId);
  }

  @Get('invitations')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER', 'GYM_MANAGER')
  async listInvitations(@CurrentGymId() gymId: string) {
    return this.authService.listInvitations(gymId);
  }

  @Post('invitations/:id/revoke')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async revokeInvitation(
    @CurrentGymId() gymId: string,
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.authService.revokeInvitation(gymId, id, req.user?.sub, req.user?.role);
  }

  @Patch('staff/:id/role')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async updateStaffRole(
    @CurrentGymId() gymId: string,
    @Req() req: any,
    @Param('id') id: string,
    @Body('role') role: any,
  ) {
    return this.authService.updateStaffRole(gymId, id, role, req.user?.sub, req.user?.role);
  }
}

