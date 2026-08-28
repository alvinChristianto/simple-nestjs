import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

@Injectable()
export class CatsService {
  private readonly include: Prisma.CatInclude = {
    owner: true,
    illnesses: { orderBy: { createdAt: 'desc' } },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateCatDto) {
    if (dto.ownerId != null) {
      await this.verifyOwnerAccess(dto.ownerId, userId);
    }

    return this.prisma.cat.create({
      data: {
        name: dto.name,
        age: dto.age,
        breed: dto.breed,
        ownerId: dto.ownerId,
        userId,
      },
      include: this.include,
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.cat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });
  }

  async findOneByUser(id: number, userId: number) {
    const cat = await this.prisma.cat.findUnique({
      where: { id },
      include: this.include,
    });

    if (!cat) {
      throw new NotFoundException(`Cat #${id} not found`);
    }

    if (cat.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return cat;
  }

  async updateByUser(id: number, userId: number, dto: UpdateCatDto) {
    await this.findOneByUser(id, userId);

    if (dto.ownerId != null) {
      await this.verifyOwnerAccess(dto.ownerId, userId);
    }

    return this.prisma.cat.update({
      where: { id },
      data: dto,
      include: this.include,
    });
  }

  async removeByUser(id: number, userId: number) {
    await this.findOneByUser(id, userId);

    return this.prisma.cat.delete({ where: { id } });
  }

  private async verifyOwnerAccess(ownerId: number, userId: number) {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new NotFoundException(`Owner #${ownerId} not found`);
    }

    if (owner.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
