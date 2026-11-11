import {
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'jake@jake.jake',
    username: 'Jacob',
    password: '$2a$10$hashedpasswordstringforsecuretesting123456',
    bio: 'Test bio description',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user when user exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-id' });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user when email exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUser);
    });

    it('should return null when email does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@test.com');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email: 'unknown@test.com' });
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return a user when username exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByUsername(mockUser.username);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: mockUser.username });
      expect(result).toEqual(mockUser);
    });

    it('should return null when username does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistentuser');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: 'nonexistentuser' });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const createInput = {
        email: 'newuser@example.com',
        username: 'newuser',
        passwordHash: 'hashedpassword',
      };

      mockUserRepository.create.mockImplementation((dto: Partial<User>) =>
        Object.assign(new User(), dto),
      );
      mockUserRepository.save.mockImplementation((saved: User) => Promise.resolve(saved));

      const result = await service.create(createInput);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: createInput.email,
        username: createInput.username,
        password: createInput.passwordHash,
        bio: null,
        image: null,
      });
      expect(result.email).toBe(createInput.email);
      expect(result.username).toBe(createInput.username);
      expect(result.password).toBe(createInput.passwordHash);
      expect(result.bio).toBeNull();
      expect(result.image).toBeNull();
    });
  });

  describe('save', () => {
    it('should persist user modifications', async () => {
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.save(mockUser);

      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { email: 'new@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException when email is taken by another user', async () => {
      const existingOtherUser = {
        ...mockUser,
        id: 'other-id-1234',
        email: 'taken@test.com',
      };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string; email?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve({ ...mockUser });
        if (criteria.email === 'taken@test.com') return Promise.resolve(existingOtherUser);
        return Promise.resolve(null);
      });

      await expect(
        service.update(mockUser.id, { email: 'taken@test.com' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when username is taken by another user', async () => {
      const existingOtherUser = {
        ...mockUser,
        id: 'other-id-1234',
        username: 'takenusername',
      };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string; username?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve({ ...mockUser });
        if (criteria.username === 'takenusername') return Promise.resolve(existingOtherUser);
        return Promise.resolve(null);
      });

      await expect(
        service.update(mockUser.id, { username: 'takenusername' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should update user fields successfully with password hashing', async () => {
      const currentUser = { ...mockUser };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string; email?: string; username?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve(currentUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const updatePayload = {
        email: 'updated@example.com',
        username: 'updatedUser',
        password: 'newSecretPassword123',
        bio: 'Updated bio text',
        image: 'https://example.com/new-avatar.png',
      };

      const result = await service.update(mockUser.id, updatePayload);

      expect(result.email).toBe('updated@example.com');
      expect(result.username).toBe('updatedUser');
      expect(result.bio).toBe('Updated bio text');
      expect(result.image).toBe('https://example.com/new-avatar.png');
      const isPasswordMatching = await bcrypt.compare('newSecretPassword123', result.password);
      expect(isPasswordMatching).toBe(true);
    });

    it('should allow retaining the same email and username without conflict', async () => {
      const currentUser = { ...mockUser };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string; email?: string; username?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve(currentUser);
        if (criteria.email === mockUser.email) return Promise.resolve(currentUser);
        if (criteria.username === mockUser.username) return Promise.resolve(currentUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.update(mockUser.id, {
        email: mockUser.email,
        username: mockUser.username,
      });

      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
    });

    it('should handle duplicate race condition error on save and throw UnprocessableEntityException', async () => {
      const currentUser = { ...mockUser };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve(currentUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        errno: 1062,
        message: 'Duplicate entry for key IDX_users_email',
      });

      await expect(
        service.update(mockUser.id, { email: 'race@test.com' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should handle username duplicate race condition with generic message and attribute to username', async () => {
      const currentUser = { ...mockUser };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve(currentUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        errno: 1062,
        message: 'Duplicate entry: constraint failed',
      });

      try {
        await service.update(mockUser.id, { username: 'raceUser' });
        fail('Expected UnprocessableEntityException');
      } catch (err) {
        expect(err).toBeInstanceOf(UnprocessableEntityException);
        const res = (err as UnprocessableEntityException).getResponse() as {
          errors: Record<string, string[]>;
        };
        expect(res.errors.username).toEqual(['has already been taken']);
      }
    });

    it('should handle unhandled database error on save and throw InternalServerErrorException', async () => {
      const currentUser = { ...mockUser };
      mockUserRepository.findOneBy.mockImplementation((criteria: { id?: string }) => {
        if (criteria.id === mockUser.id) return Promise.resolve(currentUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockRejectedValue(new Error('Fatal connection crash'));

      await expect(
        service.update(mockUser.id, { bio: 'New bio' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
