import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNotEmpty()
  @IsString()
  placename: string;

  @IsNotEmpty()
  lng: number;

  @IsNotEmpty()
  lat: number;
}

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  image: string;

  @IsNotEmpty()
  groupAdmin: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  description?: string[];

  @IsBoolean()
  @IsOptional()
  openAccess?: boolean;

  @IsOptional()
  @IsObject()
  @Type(() => LocationDto) // Ensure the LocationDto transformation is applied
  location?: {
    placename: string;
    lat: number;
    lng: number;
  };

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}
