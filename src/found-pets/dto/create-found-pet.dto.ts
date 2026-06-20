import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFoundPetDto {
  @IsString() @IsNotEmpty()
  species: string;

  @IsString() @IsOptional()
  breed?: string;

  @IsString() @IsNotEmpty()
  color: string;

  @IsString() @IsNotEmpty()
  size: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsNotEmpty()
  finder_name: string;

  @IsEmail() @IsNotEmpty()
  finder_email: string;

  @IsString() @IsNotEmpty()
  finder_phone: string;

  @IsNumber() @IsNotEmpty()
  lat: number;

  @IsNumber() @IsNotEmpty()
  lng: number;
}