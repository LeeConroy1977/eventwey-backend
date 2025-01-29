import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @IsNotEmpty()
  @IsString()
  placename: string;

  @IsNotEmpty()
  @IsNumber()
  lng: number; // Validate as a number

  @IsNotEmpty()
  @IsNumber()
  lat: number; // Validate as a number
}

class PriceBandsDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsNotEmpty()
  @IsNumber()
  ticketCount: number;
}

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  image: string;

  @IsNotEmpty()
  @IsNumber()
  date: number;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  group: number; // This will represent the group ID

  @IsNotEmpty()
  @IsString()
  duration: string;

  @IsNotEmpty()
  @IsNumber()
  going: number;

  @IsNotEmpty()
  @IsNumber()
  capacity: number;

  @IsNotEmpty()
  @IsNumber()
  availability: number;

  @IsNotEmpty()
  @IsBoolean()
  free: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  description?: string[];

  @IsOptional()
  @IsObject()
  @Type(() => LocationDto) // Ensure the LocationDto transformation is applied
  location?: {
    placename: string;
    lat: number;
    lng: number;
  };

  @ValidateNested({ each: true }) // Validates each item in the array
  @Type(() => PriceBandsDto)
  @IsArray()
  @IsOptional()
  priceBands?: PriceBandsDto[];

  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;
}
