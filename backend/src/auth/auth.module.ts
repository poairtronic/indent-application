import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { SecurityController } from './controllers/security.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { PermissionService } from './services/permission.service';
import { AuthorizationService } from './services/authorization.service';
import { SessionService } from './services/session.service';
import { LoginHistoryService } from './services/login-history.service';
import { AccountSecurityService } from './services/account-security.service';
import { AuthRateLimitService } from './services/auth-rate-limit.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController, SessionController, SecurityController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    PermissionService,
    AuthorizationService,
    SessionService,
    LoginHistoryService,
    AccountSecurityService,
    AuthRateLimitService,
    JwtStrategy,
    JwtRefreshStrategy,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    PermissionService,
    AuthorizationService,
    SessionService,
    LoginHistoryService,
    AccountSecurityService,
    AuthRateLimitService,
    PassportModule,
    JwtModule,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
