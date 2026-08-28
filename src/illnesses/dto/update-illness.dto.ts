import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateIllnessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  diagnosedAt?: string;
}
