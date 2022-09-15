import { User } from './user.entity';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of a auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asd@asd.com', 'asd');
    const [salt, hash] = user.password.split('.');

    expect(user).not.toEqual('asd');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if users signs up with an email that is in use', async () => {
    await service.signup('asd@asd.com', 'asd');

    expect.assertions(2);

    try {
      await service.signup('asd@asd.com', 'asd');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Email already registered!');
    }
  });

  it('throws an error if signing is called with an unused email', async () => {
    expect.assertions(2);

    try {
      await service.signin('asd@asd.com', 'asd');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Invalid email or password!');
    }
  });

  it('throws an error if an invalid password is passed', async () => {
    await service.signup('aaa@aaa.com.br', 'asd');

    expect.assertions(2);

    try {
      await service.signin('aaa@aaa.com.br', 'password');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Invalid email or password!');
    }
  });

  it('returns an user if correct password is provided', async () => {
    await service.signup('asd@asd.com', 'asd');

    const user = await service.signin('asd@asd.com', 'asd');

    expect(user).toBeDefined();
  });
});
