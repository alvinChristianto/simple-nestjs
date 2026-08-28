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
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesGuard } from '../ability/policies.guard';
import { CheckPolicies } from '../ability/check-policies.decorator';
import { Action } from '../ability/ability.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../ability/ability.types';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller({ path: 'cats', version: '1' })
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Cat'))
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCatDto) {
    return this.catsService.create(user, dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Cat'))
  findAll(@CurrentUser() user: AuthUser) {
    return this.catsService.findAllByUser(user);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Cat'))
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catsService.findOneByUser(id, user);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Cat'))
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatDto,
  ) {
    return this.catsService.updateByUser(id, user, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Cat'))
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.catsService.removeByUser(id, user);
  }
}
