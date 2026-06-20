import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoundPetsService } from './found-pets.service';
import { FoundPetsController } from './found-pets.controller';
import { FoundPet } from './entities/found-pet.entity';
import { LostPet } from '../lost-pets/entities/lost-pet.entity';
import { CacheModule } from '../cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoundPet, LostPet]),
    CacheModule,
  ],
  controllers: [FoundPetsController],
  providers: [FoundPetsService],
})
export class FoundPetsModule {}