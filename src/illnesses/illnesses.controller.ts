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
import { PoliciesGuard } from '../ability/policies.guard';
import { CheckPolicies } from '../ability/check-policies.decorator';
import { Action } from '../ability/ability.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../ability/ability.types';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller({ path: 'cats', version: '1' })
export class IllnessesController {
  constructor(private readonly illnessesService: IllnessesService) {}

  @Post(':catId/illnesses')
  @CheckPolicies((ability) => ability.can(Action.Create, 'Illness'))
  create(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Body() dto: CreateIllnessDto,
  ) {
    return this.illnessesService.create(catId, user, dto);
  }

  @Get(':catId/illnesses')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Illness'))
  findAll(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
  ) {
    return this.illnessesService.findAllByCat(catId, user);
  }

  @Get(':catId/illnesses/:id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Illness'))
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.illnessesService.findOneByCat(catId, id, user);
  }

  @Patch(':catId/illnesses/:id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Illness'))
  update(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIllnessDto,
  ) {
    return this.illnessesService.updateByCat(catId, id, user, dto);
  }

  @Delete(':catId/illnesses/:id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Illness'))
  remove(
    @CurrentUser() user: AuthUser,
    @Param('catId', ParseIntPipe) catId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.illnessesService.removeByCat(catId, id, user);
  }
}
