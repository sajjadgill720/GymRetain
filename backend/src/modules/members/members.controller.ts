import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('members')
@UseGuards(TenantAccessGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async listMembers(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const trainerId = user?.role === 'TRAINER' ? user.sub : undefined;
    return this.membersService.listMembers(gymId, {
      status,
      search,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
      trainerId,
    });
  }

  @Get('lookup/:identifier')
  async lookupMemberForCheckIn(
    @CurrentGymId() gymId: string,
    @Param('identifier') identifier: string,
  ) {
    return this.membersService.lookupMemberForCheckIn(gymId, identifier);
  }

  @Get(':id')
  async getMemberById(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const trainerId = user?.role === 'TRAINER' ? user.sub : undefined;
    return this.membersService.getMemberById(gymId, memberId, trainerId);
  }

  @Get(':id/qr-code')
  async getMemberQrCode(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
  ) {
    return this.membersService.getMemberQrCode(gymId, memberId);
  }

  @Post(':id/qr-code/rotate')
  async rotateMemberQrCode(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.membersService.issueOrRotateQrCredential(gymId, memberId, user.sub, user.role);
  }

  @Post(':id/qr-code/revoke')
  async revokeMemberQrCode(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.membersService.revokeQrCredential(gymId, memberId, user.sub, user.role);
  }

  @Post()
  async createMember(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.membersService.createMember(gymId, dto);
  }

  @Patch(':id')
  async updateMember(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(gymId, memberId, dto);
  }

  @Patch(':id/deactivate')
  async deactivateMember(
    @CurrentGymId() gymId: string,
    @Param('id') memberId: string,
  ) {
    return this.membersService.deactivateMember(gymId, memberId);
  }
}
