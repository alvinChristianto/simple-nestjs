import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'cats', version: '1' })
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCatDto) {
    const userId = req.user!.id;
    return this.catsService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = req.user!.id;
    return this.catsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user!.id;
    return this.catsService.findOneByUser(id, userId);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatDto,
  ) {
    const userId = req.user!.id;
    return this.catsService.updateByUser(id, userId, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user!.id;
    return this.catsService.removeByUser(id, userId);
  }
}
