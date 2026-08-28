import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsString()
  breed: string;

  @IsOptional()
  @IsInt()
  ownerId?: number;
}
