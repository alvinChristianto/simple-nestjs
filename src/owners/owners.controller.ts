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
import { PoliciesGuard } from '../ability/policies.guard';
import { CheckPolicies } from '../ability/check-policies.decorator';
import { Action } from '../ability/ability.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../ability/ability.types';

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller({ path: 'owners', version: '1' })
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Owner'))
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOwnerDto) {
    return this.ownersService.create(user, dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Owner'))
  findAll(@CurrentUser() user: AuthUser) {
    return this.ownersService.findAllByUser(user);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Owner'))
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ownersService.findOneByUser(id, user);
  }

  @Get(':id/cats')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Cat'))
  findCats(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ownersService.findCatsByOwner(id, user);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Owner'))
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOwnerDto,
  ) {
    return this.ownersService.updateByUser(id, user, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Owner'))
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.ownersService.removeByUser(id, user);
  }
}
