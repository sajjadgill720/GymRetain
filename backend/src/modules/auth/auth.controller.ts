import {
  Controller,
  Get,
  Post,
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
  @UseGuards(TenantAccessGuard)
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user);
  }

  @Post('invite-staff')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async inviteStaff(
    @CurrentGymId() gymId: string,
    @Body() dto: InviteStaffDto,
  ) {
    return this.authService.inviteStaff(gymId, dto);
  }
}
