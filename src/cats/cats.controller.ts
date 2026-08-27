import { Controller, Get, Param, Post, Query, Version } from '@nestjs/common';
import { CreateCatDto } from './create-cat.dto';

@Controller({
  path: 'cats',
  version: '1', // 👈 Pass the version here for the whole controller
})
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get(':id')
  findOne(@Param() params: any): string {
    console.log(params.id);
    return `This action returns a #${params.id} cat`;
  }

  @Get()
  async findAll(@Query('age') age?: number, @Query('breed') breed?: string) {
    if (age !== undefined || breed !== undefined) {
      return `This action returns all cats filtered by age: ${age} and breed: ${breed}`;
    }

    return 'This action returns all cats';
  }
}
