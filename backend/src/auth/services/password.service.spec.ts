import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should securely hash a password', async () => {
      const password = 'TestP@ssword123';
      const hash = await service.hash(password);
      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });
  });

  describe('compare', () => {
    it('should verify correct password', async () => {
      const password = 'TestP@ssword123';
      const hash = await service.hash(password);
      const isMatch = await service.compare(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestP@ssword123';
      const hash = await service.hash(password);
      const isMatch = await service.compare('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });
});
