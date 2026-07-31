import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Enterprise Manufacturing Indent & Costing Management System')
    .setDescription(
      `Authentication, Authorization, and Security endpoints

## Authorization
This API uses Bearer JWT token authentication.
Every authenticated endpoint requires a valid access token in the Authorization header.

### Roles
- **Admin** - Full system access
- **Design Engineer** - Indent and cost sheet management
- **Stores Executive** - Inventory and material verification
- **Accounts Executive** - Cost verification and variance review
- **Production Executive** - Production queue and material receipt
- **Senior Manager** - Review and approval workflows
- **General Manager** - Final approvals and reports

### Permissions
Endpoints are protected by permission codes (e.g., \`users.view\`, \`indent.create\`).
Access is denied with 403 Forbidden if the user lacks the required permission.

### Guard Flow
1. JwtAuthGuard - Validates JWT token
2. RolesGuard - Checks required roles (if specified)
3. PermissionsGuard - Checks required permissions (if specified)

## Security Features (Phase 8C)
- **Session Management** - Active session tracking with device/browser/IP info
- **Login History** - Complete audit trail of login attempts
- **Account Locking** - Automatic lock after 5 failed attempts (30 min timeout)
- **Refresh Token Rotation** - Tokens rotated on every refresh, old tokens invalidated
- **Password Change Tracking** - Password age monitoring
- **Security Events** - Login, logout, failed login, password change, account lock/unlock tracking
`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
