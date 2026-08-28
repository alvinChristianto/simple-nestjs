import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOwnerDto) {
    return this.prisma.owner.create({
      data: { ...dto, userId },
      include: { cats: true },
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.owner.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: number, userId: number) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { cats: true },
    });

    if (!owner) {
      throw new NotFoundException(`Owner #${id} not found`);
    }

    if (owner.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return owner;
  }

  async findCatsByOwner(id: number, userId: number) {
    await this.findOneByUser(id, userId);

    return this.prisma.cat.findMany({
      where: { ownerId: id, userId },
      orderBy: { createdAt: 'desc' },
      include: { owner: true, illnesses: true },
    });
  }

  async updateByUser(id: number, userId: number, dto: UpdateOwnerDto) {
    await this.findOneByUser(id, userId);

    return this.prisma.owner.update({
      where: { id },
      data: dto,
      include: { cats: true },
    });
  }

  async removeByUser(id: number, userId: number) {
    await this.findOneByUser(id, userId);

    return this.prisma.owner.delete({ where: { id } });
  }
}
