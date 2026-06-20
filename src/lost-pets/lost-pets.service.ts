import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LostPet } from './entities/lost-pet.entity';
import { CreateLostPetDto } from './dto/create-lost-pet.dto';
import { UpdateLostPetDto } from './dto/update-lost-pet.dto';
import { REDIS_CLIENT } from '../cache.module';

@Injectable()
export class LostPetsService {
  constructor(
    @InjectRepository(LostPet)
    private readonly lostPetRepo: Repository<LostPet>,
    @Inject(REDIS_CLIENT)
    private readonly redis: any,
  ) {}

  async create(createDto: CreateLostPetDto) {
    const {
      lat, lng, name, species, owner_email, breed, color,
      size, description, owner_name, owner_phone, address, lost_date
    } = createDto;

    const result = await this.lostPetRepo.query(`
      INSERT INTO lost_pets (
        name, species, breed, color, size, description, 
        owner_name, owner_email, owner_phone, address, 
        lost_date, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
        ST_SetSRID(ST_MakePoint($12, $13), 4326)
      ) RETURNING id;
    `, [
      name,
      species,
      breed || 'Desconocida',
      color || 'No especificado',
      size || 'mediano',
      description || '',
      owner_name || 'Diego Eduardo',
      owner_email,
      owner_phone || '0000000000',
      address || 'León, Gto',
      lost_date || new Date(),
      lng,
      lat,
    ]);

    await this.redis.del('lost_pets:all');

    return { id: result[0].id, message: 'Mascota registrada con éxito' };
  }

  async findAll() {
    const cacheKey = 'lost_pets:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('[CACHE HIT] lost_pets:all');
      return JSON.parse(cached);
    }
    const data = await this.lostPetRepo.query(`
      SELECT *, 
      ST_X(location::geometry) as lng, 
      ST_Y(location::geometry) as lat 
      FROM lost_pets 
      WHERE is_active = true
    `);
    await this.redis.setEx(cacheKey, 60, JSON.stringify(data));
    console.log('[CACHE SET] lost_pets:all');
    return data;
  }

  async findOne(id: number) {
    const result = await this.lostPetRepo.query(`
      SELECT *, 
      ST_X(location::geometry) as lng, 
      ST_Y(location::geometry) as lat 
      FROM lost_pets 
      WHERE id = $1
    `, [id]);
    if (!result[0]) throw new NotFoundException('Mascota no encontrada');
    return result[0];
  }

  async update(id: number, updateDto: UpdateLostPetDto) {
    await this.redis.del('lost_pets:all');
    return await this.lostPetRepo.update(id, updateDto);
  }

  async remove(id: number) {
    await this.redis.del('lost_pets:all');
    return await this.lostPetRepo.update(id, { is_active: false });
  }
}