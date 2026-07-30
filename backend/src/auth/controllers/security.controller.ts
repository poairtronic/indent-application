import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountSecurityService } from '../services/account-security.service';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Security')
@ApiBearerAuth()
@Controller('auth')
export class SecurityController {
  constructor(
    private readonly accountSecurityService: AccountSecurityService,
  ) {}

  @Get('security-status')
  @ApiOperation({ summary: 'Get account security status' })
  @ApiResponse({ status: 200, description: 'Security status details' })
  async getSecurityStatus(@CurrentUser() user: any) {
    return this.accountSecurityService.getSecurityStatus(user.id);
  }

  @Post('unlock-account')
  @ApiOperation({ summary: 'Unlock current user account (auto after timeout)' })
  @ApiResponse({ status: 200, description: 'Account unlocked' })
  async unlockAccount(@CurrentUser() user: any) {
    await this.accountSecurityService.unlockAccount(user.id);
    return { message: 'Account unlocked successfully' };
  }
}
