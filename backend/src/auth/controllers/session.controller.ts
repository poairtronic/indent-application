import { Controller, Get, Delete, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { LoginHistoryService } from '../services/login-history.service';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('auth')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly loginHistoryService: LoginHistoryService,
  ) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@CurrentUser() user: any) {
    const sessions = await this.sessionService.getUserSessions(user.id);
    return sessions;
  }

  @Get('login-history')
  @ApiOperation({ summary: 'Get login history for current user' })
  @ApiResponse({ status: 200, description: 'List of login history entries' })
  async getLoginHistory(@CurrentUser() user: any) {
    const history = await this.loginHistoryService.getLoginHistory(user.id);
    return history;
  }

  @Delete('session/:id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.sessionService.revokeSession(id, user.id);
    return { message: 'Session revoked successfully' };
  }

  @Post('logout-other-sessions')
  @ApiOperation({ summary: 'Logout all other sessions except current' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked' })
  async logoutOtherSessions(@CurrentUser() user: any) {
    const currentSession = await this.sessionService.getUserSessions(user.id);
    const currentSessionId = currentSession.find((s) => s.status === 'ACTIVE')?.id;
    if (currentSessionId) {
      await this.sessionService.revokeOtherSessions(currentSessionId, user.id);
    }
    return { message: 'Other sessions logged out successfully' };
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout all active sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(@CurrentUser() user: any) {
    await this.sessionService.revokeAllSessions(user.id);
    return { message: 'All sessions logged out successfully' };
  }
}
