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
import { User } from '../../entities/user.entity';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  description?: string[];

  @IsBoolean()
  @IsOptional()
  openAccess?: boolean;

  @IsOptional()
  @IsObject()
  @Type(() => LocationDto)
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
