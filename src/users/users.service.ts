import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CaslAbilityFactory } from '../ability/casl-ability.factory';
import { Action } from '../ability/ability.types';
import type { AppAbility, AuthUser, Subjects } from '../ability/ability.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly publicSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
  } satisfies Prisma.UserSelect;

  constructor(
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(dto: CreateUserDto, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Create, 'User');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: dto.role,
      },
      select: this.publicSelect,
    });
  }

  async findAll(user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'User');

    const users = await this.prisma.user.findMany({
      select: this.publicSelect,
    });

    return users.filter((target) =>
      ability.can(Action.Read, subject('User', target)),
    );
  }

  async findOne(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'User');

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.publicSelect,
        cats: { select: { id: true, name: true, age: true, breed: true } },
      },
    });

    if (!target) {
      throw new NotFoundException(`User #${id} not found`);
    }

    this.assert(ability, Action.Read, subject('User', target));
    return target;
  }

  async update(id: number, dto: UpdateUserDto, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Update, 'User');

    const target = await this.prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new NotFoundException(`User #${id} not found`);
    }

    this.assert(ability, Action.Update, subject('User', target));

    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      name: dto.name,
      role: dto.role,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.publicSelect,
    });
  }

  async remove(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Delete, 'User');

    const target = await this.prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new NotFoundException(`User #${id} not found`);
    }

    this.assert(ability, Action.Delete, subject('User', target));

    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }

  private assert(
    ability: AppAbility,
    action: Action,
    resource: Subjects,
  ): void {
    if (!ability.can(action, resource)) {
      throw new ForbiddenException('Access denied');
    }
  }
}
