import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';

describe('Database Resilience & Failure Recovery', () => {
  let prismaService: PrismaService;
  let originalDbUrl: string | undefined;

  beforeAll(() => {
    originalDbUrl = process.env.DATABASE_URL;
  });

  beforeEach(async () => {
    // Inject bad database URL before module instantiation
    process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_password@localhost:5432/invalid_db?schema=public';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Restore original DB URL
    if (originalDbUrl) {
      process.env.DATABASE_URL = originalDbUrl;
    }
    try {
      await prismaService.$disconnect();
    } catch (e) {}
  });

  it('should reject queries with a connection error rather than hanging indefinitely', async () => {
    const startTime = Date.now();
    let error: any;
    
    try {
      await prismaService.user.findFirst();
    } catch (e) {
      error = e;
    }

    const duration = Date.now() - startTime;
    
    expect(error).toBeDefined();
    expect(error.message).toMatch(/Authentication failed|Can't reach database server/);
    
    // Ensure timeout resolves gracefully rather than hanging
    expect(duration).toBeLessThan(5000); 
  });
});
