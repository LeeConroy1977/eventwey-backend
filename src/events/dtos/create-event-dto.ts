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
import { Group } from 'src/entities/group.entity';

class LocationDto {
  @IsNotEmpty()
  @IsString()
  placename: string;

  @IsNotEmpty()
  @IsNumber()
  lng: number; 

  @IsNotEmpty()
  @IsNumber()
  lat: number; 
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
  group: number;

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
  @Type(() => LocationDto)
  location?: {
    placename: string;
    lat: number;
    lng: number;
  };

  @ValidateNested({ each: true }) 
  @Type(() => PriceBandsDto)
  @IsArray()
  @IsOptional()
  priceBands?: PriceBandsDto[];

  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;
}
