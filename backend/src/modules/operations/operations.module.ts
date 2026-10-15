import { Body, Controller, Get, Module, Post, UseGuards } from "@nestjs/common";
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { OperationsService, OperationKind } from "./operations.service";
import { TenantAccessGuard } from "../../common/guards/tenant-access.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentGymId } from "../../common/decorators/current-gym.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
class OperationCommandDto {
  @IsIn(["leads", "sessions", "expenses", "tasks"]) kind: OperationKind;
  @IsIn(["create", "update"]) action: "create" | "update";
  @IsOptional() @IsString() id?: string;
  @IsInt() @Min(0) version: number;
  @IsObject() data: Record<string, unknown>;
}
@Controller("operations")
@UseGuards(TenantAccessGuard, RolesGuard)
@Roles("GYM_OWNER", "GYM_MANAGER")
class OperationsController {
  constructor(private readonly service: OperationsService) {}
  @Get() read(@CurrentGymId() gymId: string) {
    return this.service.read(gymId);
  }
  @Post() mutate(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() command: OperationCommandDto,
  ) {
    return this.service.mutate(gymId, user, command);
  }
}
@Module({ controllers: [OperationsController], providers: [OperationsService] })
export class OperationsModule {}
