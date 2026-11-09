import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

      const entityInstance = new User();
      mockUserRepository.create.mockReturnValue(entityInstance);
      mockUserRepository.save.mockImplementation((saved: User) => Promise.resolve(saved));

      const result = await service.create(createInput);

      expect(mockUserRepository.create).toHaveBeenCalled();
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
});
