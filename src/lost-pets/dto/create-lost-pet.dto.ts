import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLostPetDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  species: string;

  @IsString() @IsOptional()
  breed?: string;

  @IsString() @IsOptional()
  color?: string;

  @IsString() @IsOptional()
  size?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsNotEmpty()
  owner_name: string;

  @IsEmail() @IsNotEmpty()
  owner_email: string;

  @IsString() @IsNotEmpty()
  owner_phone: string;

  @IsString() @IsNotEmpty()
  address: string;

  @IsString() @IsNotEmpty()
  lost_date: string; 

  @IsNumber() @IsNotEmpty()
  lat: number;

  @IsNumber() @IsNotEmpty()
  lng: number;
}