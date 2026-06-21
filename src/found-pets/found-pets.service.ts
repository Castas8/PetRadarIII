import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoundPet } from './entities/found-pet.entity';
import { LostPet } from '../lost-pets/entities/lost-pet.entity';
import { CreateFoundPetDto } from './dto/create-found-pet.dto';
import { UpdateFoundPetDto } from './dto/update-found-pet.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { REDIS_CLIENT } from '../cache.module';

@Injectable()
export class FoundPetsService {
  constructor(
    @InjectRepository(FoundPet)
    private readonly foundRepo: Repository<FoundPet>,
    @InjectRepository(LostPet)
    private readonly lostRepo: Repository<LostPet>,
    private readonly mailerService: MailerService,
    @Inject(REDIS_CLIENT)
    private readonly redis: any,
  ) {}

  async create(dto: CreateFoundPetDto) {
    const result = await this.foundRepo.query(`
      INSERT INTO found_pets (
        species, breed, color, size, description, 
        finder_name, finder_email, finder_phone, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
        ST_SetSRID(ST_MakePoint($9, $10), 4326)
      ) RETURNING id;
    `, [
      dto.species, dto.breed || 'Desconocida', dto.color, dto.size, dto.description,
      dto.finder_name, dto.finder_email, dto.finder_phone, dto.lng, dto.lat
    ]);

    await this.redis.del('found_pets:all');

    const matches = await this.lostRepo.query(`
      SELECT *, 
      ST_X(location::geometry) as lng, 
      ST_Y(location::geometry) as lat,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance
      FROM lost_pets
      WHERE is_active = true
      AND ST_DWithin(
        location, 
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 
        500
      )
      ORDER BY distance ASC;
    `, [dto.lng, dto.lat]);

    // El envío de correos corre en segundo plano (sin await) para no
    // bloquear la respuesta HTTP si el SMTP tarda o falla.
    this.sendMatchEmails(matches, dto).catch((err) =>
      console.error('Error procesando alertas de correo:', err.message),
    );

    return {
      message: 'Reporte creado y alertas procesadas',
      found_id: result[0].id,
      matches_found: matches.length,
      nearby_lost_pets: matches,
    };
  }

  private async sendMatchEmails(matches: any[], dto: CreateFoundPetDto) {
    for (const match of matches) {
      try {
        const mapUrl = `https://quickchart.io/map?width=600&height=300&zoom=15&center=${dto.lat},${dto.lng}&markers=color:red|label:P|${match.lat},${match.lng}&markers=color:blue|label:F|${dto.lat},${dto.lng}`;
        await this.mailerService.sendMail({
          to: match.owner_email,
          subject: `¡Posible hallazgo de tu mascota: ${match.name}!`,
          html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 12px; max-width: 600px;">
              <h2 style="color: #d32f2f; text-align: center;">¡Alerta de PetRadar!</h2>
              <p>Hola <strong>${match.owner_name}</strong>,</p>
              <p>Se ha reportado una mascota encontrada a solo <strong>${Math.round(match.distance)} metros</strong> de tu ubicación.</p>
              <div style="text-align: center; margin: 20px 0;">
                <img src="${mapUrl}" style="width: 100%; border-radius: 8px; border: 1px solid #ddd;" alt="Mapa de ubicación" />
                <p style="font-size: 11px; color: #777;">🔴 (P) Tu reporte | 🔵 (F) Hallazgo actual</p>
              </div>
              <p><strong>Descripción del hallazgo:</strong> ${dto.species} ${dto.color}. "${dto.description}"</p>
              <p>Contacta de inmediato a <strong>${dto.finder_name}</strong> al: 📞 <strong>${dto.finder_phone}</strong></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">Generado automáticamente por PetRadar León, Gto.</p>
            </div>
          `,
        });
        console.log(`Correo enviado a: ${match.owner_email}`);
      } catch (err) {
        console.error(`Error al enviar a ${match.owner_email}:`, err.message);
      }
    }
  }

  async findAll() {
    const cacheKey = 'found_pets:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('[CACHE HIT] found_pets:all');
      return JSON.parse(cached);
    }
    const data = await this.foundRepo.query(`
      SELECT *, 
      ST_X(location::geometry) as lng, 
      ST_Y(location::geometry) as lat 
      FROM found_pets
    `);
    await this.redis.setEx(cacheKey, 60, JSON.stringify(data));
    console.log('[CACHE SET] found_pets:all');
    return data;
  }

  async findOne(id: number) {
    const result = await this.foundRepo.query(`
      SELECT *, 
      ST_X(location::geometry) as lng, 
      ST_Y(location::geometry) as lat 
      FROM found_pets WHERE id = $1
    `, [id]);
    if (!result[0]) throw new NotFoundException('Reporte no encontrado');
    return result[0];
  }

  async update(id: number, updateFoundPetDto: UpdateFoundPetDto) {
    await this.redis.del('found_pets:all');
    return await this.foundRepo.update(id, updateFoundPetDto);
  }

  async remove(id: number) {
    await this.redis.del('found_pets:all');
    return await this.foundRepo.delete(id);
  }
}