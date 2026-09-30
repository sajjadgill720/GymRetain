import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(TenantAccessGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/message
   * Streams AI insights response via Server-Sent Events (SSE)
   */
  @Post('message')
  async sendMessage(
    @CurrentGymId() gymId: string,
    @CurrentUser('sub') userId: string,
    @Body('message') message: string,
    @Body('conversationId') conversationId: string | undefined,
    @Res() res: Response,
  ) {
    if (!message || !message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    return this.chatService.streamChatMessage(
      gymId,
      userId,
      message.trim(),
      conversationId,
      res,
    );
  }

  /**
   * GET /chat/conversations
   * Retrieves conversation threads for current gym and user
   */
  @Get('conversations')
  async getConversations(
    @CurrentGymId() gymId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.chatService.getConversations(gymId, userId);
  }

  /**
   * GET /chat/conversations/:id/messages
   * Retrieves message history for a specific conversation
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentGymId() gymId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getMessages(gymId, conversationId);
  }

  /**
   * DELETE /chat/conversations/:id
   * Removes a conversation thread
   */
  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentGymId() gymId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.deleteConversation(gymId, conversationId);
  }
}
