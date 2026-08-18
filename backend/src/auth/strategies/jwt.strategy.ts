import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../redis-cache/redis-cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = `user:session:${payload.sub}`;

    try {
      const cachedUser = await this.cacheService.get<any>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }
    } catch (err) {
      // Fallback gracefully on cache read failure
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!user || user.isDeleted || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const { password: _pw, ...safeUser } = user;
    void _pw;
    const permissions = safeUser.role.rolePermissions.map((rp) => rp.permission.code);
    const result = { ...safeUser, permissions };

    try {
      await this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
    } catch (err) {
      // Ignore cache write failure
    }

    return result;
  }
}
