import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req: any) {
    return this.notificationsService.getNotificationsForUser(req.user.userId);
  }

  @Patch('read-all')
  async readAll(@Request() req: any) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Patch(':id/read')
  async readOne(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }
}
