import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMessageDto {
  

    @IsNotEmpty()
    @IsString()
    content: string;
  }