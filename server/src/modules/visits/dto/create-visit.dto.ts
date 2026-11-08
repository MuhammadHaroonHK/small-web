import { Transform } from 'class-transformer';
import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VISIT_SOURCES } from '../schemas/visit.schema.js';

export class CreateVisitDto {
  @IsMongoId()
  personId!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(200)
  address!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(200)
  title?: string;

  @IsIn(VISIT_SOURCES)
  source!: (typeof VISIT_SOURCES)[number];
}
