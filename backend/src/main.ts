import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppLogger } from './observability/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(AppLogger));

  // Trust the Render load balancer proxy to correctly resolve client IPs (req.ip)
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter && httpAdapter.getInstance) {
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        },
      },
      hsts:
        process.env.NODE_ENV === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
      xFrameOptions: { action: 'deny' },
    }),
  );

  app.use(
    compression({
      threshold: 1024,
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  app.use((req: any, res: any, next: () => void) => {
    if (req.path.startsWith('/api') && !req.path.includes('/attachments/download/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (req.path.includes('/attachments/download/')) {
      res.setHeader('Cache-Control', 'private, max-age=3600, must-revalidate');
    }
    next();
  });

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server requests (no origin), localhost origins, and production FRONTEND_URL
      if (
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
        origin === process.env.FRONTEND_URL
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS policy'), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

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

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
