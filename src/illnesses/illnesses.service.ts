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
import { CreateIllnessDto } from './dto/create-illness.dto';
import { UpdateIllnessDto } from './dto/update-illness.dto';

@Injectable()
export class IllnessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async create(catId: number, user: AuthUser, dto: CreateIllnessDto) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const cat = await this.verifyCatAccess(catId, ability);
    this.assert(ability, Action.Create, 'Illness');

    return this.prisma.illness.create({
      data: {
        name: dto.name,
        description: dto.description,
        diagnosedAt: dto.diagnosedAt,
        catId,
        userId: cat.userId,
      },
      include: { cat: true },
    });
  }

  async findAllByCat(catId: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    await this.verifyCatAccess(catId, ability);
    this.assert(ability, Action.Read, 'Illness');

    const illnesses = await this.prisma.illness.findMany({
      where: {
        catId,
        ...(user.role === Role.USER ? { userId: user.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return illnesses.filter((illness) =>
      ability.can(Action.Read, subject('Illness', illness)),
    );
  }

  async findOneByCat(catId: number, id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    await this.verifyCatAccess(catId, ability);
    this.assert(ability, Action.Read, 'Illness');

    const illness = await this.prisma.illness.findUnique({
      where: { id },
      include: { cat: true },
    });

    if (!illness) {
      throw new NotFoundException(`Illness #${id} not found`);
    }

    if (illness.catId !== catId) {
      throw new NotFoundException(`Illness #${id} not found`);
    }

    this.assert(ability, Action.Read, subject('Illness', illness));
    return illness;
  }

  async updateByCat(
    catId: number,
    id: number,
    user: AuthUser,
    dto: UpdateIllnessDto,
  ) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const illness = await this.findOneByCat(catId, id, user);
    this.assert(ability, Action.Update, subject('Illness', illness));

    return this.prisma.illness.update({
      where: { id },
      data: dto,
      include: { cat: true },
    });
  }

  async removeByCat(catId: number, id: number, user: AuthUser) {
    const ability = this.caslAbilityFactory.createForUser(user);
    const illness = await this.findOneByCat(catId, id, user);
    this.assert(ability, Action.Delete, subject('Illness', illness));

    return this.prisma.illness.delete({ where: { id } });
  }

  private async verifyCatAccess(catId: number, ability: AppAbility) {
    const cat = await this.prisma.cat.findUnique({ where: { id: catId } });

    if (!cat) {
      throw new NotFoundException(`Cat #${catId} not found`);
    }

    this.assert(ability, Action.Read, subject('Cat', cat));
    return cat;
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
