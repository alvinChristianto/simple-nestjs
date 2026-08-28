import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaslAbilityFactory } from '../ability/casl-ability.factory';
import { Action } from '../ability/ability.types';
import type { AppAbility, AuthUser, Subjects } from '../ability/ability.types';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(user: AuthUser, dto: CreateOwnerDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Create, 'Owner');

    return this.prisma.owner.create({
      data: { ...dto, userId: user.id },
      include: { cats: true },
    });
  }

  async findAllByUser(user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'Owner');

    const owners = await this.prisma.owner.findMany({
      where: user.role === Role.USER ? { userId: user.id } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return owners.filter((owner) =>
      ability.can(Action.Read, subject('Owner', owner)),
    );
  }

  async findOneByUser(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    this.assert(ability, Action.Read, 'Owner');

    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { cats: true },
    });

    if (!owner) {
      throw new NotFoundException(`Owner #${id} not found`);
    }

    this.assert(ability, Action.Read, subject('Owner', owner));
    return owner;
  }

  async findCatsByOwner(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    await this.findOneByUser(id, user);
    this.assert(ability, Action.Read, 'Cat');

    const cats = await this.prisma.cat.findMany({
      where: {
        ownerId: id,
        ...(user.role === Role.USER ? { userId: user.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { owner: true, illnesses: true },
    });

    return cats.filter((cat) => ability.can(Action.Read, subject('Cat', cat)));
  }

  async updateByUser(id: number, user: AuthUser, dto: UpdateOwnerDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const owner = await this.findOneByUser(id, user);
    this.assert(ability, Action.Update, subject('Owner', owner));

    return this.prisma.owner.update({
      where: { id },
      data: dto,
      include: { cats: true },
    });
  }

  async removeByUser(id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const owner = await this.findOneByUser(id, user);
    this.assert(ability, Action.Delete, subject('Owner', owner));

    return this.prisma.owner.delete({ where: { id } });
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
