import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface CreateUserData {
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly bio?: string | null;
  readonly image?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async create(userData: CreateUserData): Promise<User> {
    const newUser = this.userRepository.create();
    newUser.email = userData.email;
    newUser.username = userData.username;
    newUser.password = userData.passwordHash;
    newUser.bio = userData.bio ?? null;
    newUser.image = userData.image ?? null;
    return this.userRepository.save(newUser);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
