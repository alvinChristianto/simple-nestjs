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
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Express } from 'express';

type AuthUser = Express.User;

@UseGuards(JwtAuthGuard)
@Controller({ path: 'owners', version: '1' })
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOwnerDto) {
    return this.ownersService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.ownersService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ownersService.findOneByUser(id, user.id);
  }

  @Get(':id/cats')
  findCats(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ownersService.findCatsByOwner(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOwnerDto,
  ) {
    return this.ownersService.updateByUser(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.ownersService.removeByUser(id, user.id);
  }
}
