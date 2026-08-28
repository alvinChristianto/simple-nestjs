import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IllnessesService } from './illnesses.service';
import { CreateIllnessDto } from './dto/create-illness.dto';
import { UpdateIllnessDto } from './dto/update-illness.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Express } from 'express';

type AuthUser = Express.User;

@UseGuards(JwtAuthGuard)
@Controller({ path: 'cats', version: '1' })
export class IllnessesController {
  constructor(private readonly illnessesService: IllnessesService) {}

  @Post(':catId/illnesses')
  create(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Body() dto: CreateIllnessDto,
  ) {
    return this.illnessesService.create(catId, user.id, dto);
  }

  @Get(':catId/illnesses')
  findAll(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
  ) {
    return this.illnessesService.findAllByCat(catId, user.id);
  }

  @Get(':catId/illnesses/:id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.illnessesService.findOneByCat(catId, id, user.id);
  }

  @Patch(':catId/illnesses/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIllnessDto,
  ) {
    return this.illnessesService.updateByCat(catId, id, user.id, dto);
  }

  @Delete(':catId/illnesses/:id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.illnessesService.removeByCat(catId, id, user.id);
  }
}
