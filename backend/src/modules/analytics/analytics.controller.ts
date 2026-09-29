import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';

@Controller('analytics')
@UseGuards(TenantAccessGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardSummary(@CurrentGymId() gymId: string) {
    return this.analyticsService.getDashboardSummary(gymId);
  }

  @Get('attendance-trends')
  async getAttendanceTrends(
    @CurrentGymId() gymId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getAttendanceTrends(
      gymId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('retention-deep')
  async getRetentionAnalytics(@CurrentGymId() gymId: string) {
    return this.analyticsService.getRetentionAnalytics(gymId);
  }

  @Post('ai-assistant')
  async generateAiInsight(
    @CurrentGymId() gymId: string,
    @Body() dto: { query?: string; anonymizedData?: any },
  ) {
    return this.analyticsService.generateAiInsight(gymId, dto);
  }
}

