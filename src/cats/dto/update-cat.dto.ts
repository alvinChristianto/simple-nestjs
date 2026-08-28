import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsInt()
  ownerId?: number;
}
