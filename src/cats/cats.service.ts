import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

@Injectable()
export class CatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateCatDto) {
    return this.prisma.cat.create({
      data: {
        name: dto.name,
        age: dto.age,
        breed: dto.breed,
        userId,
      },
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.cat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: number, userId: number) {
    const cat = await this.prisma.cat.findUnique({ where: { id } });

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

    return this.prisma.cat.update({
      where: { id },
      data: dto,
    });
  }

  async removeByUser(id: number, userId: number) {
    await this.findOneByUser(id, userId);

    return this.prisma.cat.delete({ where: { id } });
  }
}
