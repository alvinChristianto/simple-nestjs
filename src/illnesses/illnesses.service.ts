import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIllnessDto } from './dto/create-illness.dto';
import { UpdateIllnessDto } from './dto/update-illness.dto';

@Injectable()
export class IllnessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(catId: number, userId: number, dto: CreateIllnessDto) {
    await this.verifyCatAccess(catId, userId);

    return this.prisma.illness.create({
      data: {
        name: dto.name,
        description: dto.description,
        diagnosedAt: dto.diagnosedAt,
        catId,
        userId,
      },
      include: { cat: true },
    });
  }

  async findAllByCat(catId: number, userId: number) {
    await this.verifyCatAccess(catId, userId);

    return this.prisma.illness.findMany({
      where: { catId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByCat(catId: number, id: number, userId: number) {
    const illness = await this.prisma.illness.findUnique({
      where: { id },
      include: { cat: true },
    });

    if (!illness) {
      throw new NotFoundException(`Illness #${id} not found`);
    }

    if (illness.catId !== catId || illness.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return illness;
  }

  async updateByCat(
    catId: number,
    id: number,
    userId: number,
    dto: UpdateIllnessDto,
  ) {
    await this.findOneByCat(catId, id, userId);

    return this.prisma.illness.update({
      where: { id },
      data: dto,
      include: { cat: true },
    });
  }

  async removeByCat(catId: number, id: number, userId: number) {
    await this.findOneByCat(catId, id, userId);

    return this.prisma.illness.delete({ where: { id } });
  }

  private async verifyCatAccess(catId: number, userId: number) {
    const cat = await this.prisma.cat.findUnique({ where: { id: catId } });

    if (!cat) {
      throw new NotFoundException(`Cat #${catId} not found`);
    }

    if (cat.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return cat;
  }
}
