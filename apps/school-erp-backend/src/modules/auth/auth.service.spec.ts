import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../database/redis.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockReturnValue('mock_jwt_token_123'),
  })),
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue('mock_jwt_secret'),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    registrationRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_jwt_token_123'),
  };

  const mockRedis = {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully log in and return JWT token on correct credentials', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr_1',
        email: 'admin@oakridge.edu',
        name: 'Arthur Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash,
        schoolId: 'sch_1',
        themeColor: '#0D9488',
        school: {
          id: 'sch_1',
          name: 'Oakridge',
          code: 'OAK-RIDGE',
          activeYear: '2026-2027',
        },
      });

      const result = await service.login({
        email: 'admin@oakridge.edu',
        password: 'secret123',
      });

      expect(result.token).toBe('mock_jwt_token_123');
      expect(result.user.email).toBe('admin@oakridge.edu');
      expect(result.user.role).toBe('ADMIN');
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });
});
