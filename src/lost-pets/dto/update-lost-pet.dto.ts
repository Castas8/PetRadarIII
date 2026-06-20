import { PartialType } from '@nestjs/mapped-types';
import { CreateLostPetDto } from './create-lost-pet.dto';

export class UpdateLostPetDto extends PartialType(CreateLostPetDto) {}
