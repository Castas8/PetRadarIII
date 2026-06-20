import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FoundPetsService } from './found-pets.service';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { UpdateFoundPetDto } from './dto/update-found-pet.dto';

@Controller('found-pets')
export class FoundPetsController {
  constructor(private readonly foundPetsService: FoundPetsService) {}

  @Post()
  create(@Body() createFoundPetDto: CreateFoundPetDto) {
    return this.foundPetsService.create(createFoundPetDto);
  }

  @Get()
  findAll() {
    return this.foundPetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foundPetsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFoundPetDto: UpdateFoundPetDto) {
    return this.foundPetsService.update(+id, updateFoundPetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foundPetsService.remove(+id);
  }
}
