import { PartialType } from '@nestjs/mapped-types';
import { CreateFoundPetDto } from './create-found-pet.dto';

export class UpdateFoundPetDto extends PartialType(CreateFoundPetDto) {}
