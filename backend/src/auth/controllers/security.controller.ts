import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AccountSecurityService } from '../services/account-security.service';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('Security')
@ApiBearerAuth()
@Controller('auth')
export class SecurityController {
  constructor(
    private readonly accountSecurityService: AccountSecurityService,
    private readonly authService: AuthService,
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

  @Post('admin/unlock-account/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin unlock locked user account' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User account unlocked successfully' })
  @ApiResponse({ status: 400, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async adminUnlockAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: any,
  ) {
    await this.authService.adminUnlockAccount(userId, admin?.id);
    return { message: 'Account unlocked successfully' };
  }
}
