import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaslAbilityFactory } from '../ability/casl-ability.factory';
import { Action } from '../ability/ability.types';
import type { AppAbility, AuthUser, Subjects } from '../ability/ability.types';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

@Injectable()
export class CatsService {
  private readonly include: Prisma.CatInclude = {
    owner: true,
    illnesses: { orderBy: { createdAt: 'desc' } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(user: AuthUser, dto: CreateCatDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Create, 'Cat');

    if (dto.ownerId != null) {
      await this.verifyOwnerAccess(dto.ownerId, user, ability);
    }

    return this.prisma.cat.create({
      data: {
        name: dto.name,
        age: dto.age,
        breed: dto.breed,
        ownerId: dto.ownerId,
        userId: user.id,
      },
      include: this.include,
    });
  }

  async findAllByUser(user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'Cat');

    const cats = await this.prisma.cat.findMany({
      where: user.role === Role.USER ? { userId: user.id } : undefined,
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });

    return cats.filter((cat) => ability.can(Action.Read, subject('Cat', cat)));
  }

  async findOneByUser(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'Cat');

    const cat = await this.prisma.cat.findUnique({
      where: { id },
      include: this.include,
    });

    if (!cat) {
      throw new NotFoundException(`Cat #${id} not found`);
    }

    this.assert(ability, Action.Read, subject('Cat', cat));
    return cat;
  }

  async updateByUser(id: number, user: AuthUser, dto: UpdateCatDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const cat = await this.findOneByUser(id, user);
    this.assert(ability, Action.Update, subject('Cat', cat));

    if (dto.ownerId != null) {
      await this.verifyOwnerAccess(dto.ownerId, user, ability);
    }

    return this.prisma.cat.update({
      where: { id },
      data: dto,
      include: this.include,
    });
  }

  async removeByUser(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const cat = await this.findOneByUser(id, user);
    this.assert(ability, Action.Delete, subject('Cat', cat));

    return this.prisma.cat.delete({ where: { id } });
  }

  private async verifyOwnerAccess(
    ownerId: number,
    user: AuthUser,
    ability: AppAbility,
  ) {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException(`Owner #${ownerId} not found`);
    }

    this.assert(ability, Action.Read, subject('Owner', owner));
    this.assert(ability, Action.Update, subject('Owner', owner));
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
