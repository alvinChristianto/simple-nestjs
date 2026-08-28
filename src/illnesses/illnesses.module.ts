import { Module } from '@nestjs/common';
import { IllnessesService } from './illnesses.service';
import { IllnessesController } from './illnesses.controller';

@Module({
  controllers: [IllnessesController],
  providers: [IllnessesService],
  exports: [IllnessesService],
})
export class IllnessesModule {}
