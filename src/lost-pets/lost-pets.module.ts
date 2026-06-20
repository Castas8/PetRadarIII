import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostPetsService } from './lost-pets.service';
import { LostPetsController } from './lost-pets.controller';
import { LostPet } from './entities/lost-pet.entity';
import { CacheModule } from '../cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LostPet]),
    CacheModule,
  ],
  controllers: [LostPetsController],
  providers: [LostPetsService],
  exports: [LostPetsService],
})
export class LostPetsModule {}