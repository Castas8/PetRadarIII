import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { LostPetsModule } from './lost-pets/lost-pets.module';
import { FoundPetsModule } from './found-pets/found-pets.module';
import { CacheModule } from './cache.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'petradar',
      autoLoadEntities: true,
      synchronize: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.MAIL_PORT || '2525'),
        auth: {
          user: process.env.MAIL_USER || '113d8f3565b578',
          pass: process.env.MAIL_PASS || '245238f313f42c',
        },
      },
    }),
    CacheModule,
    LostPetsModule,
    FoundPetsModule,
  ],
})
export class AppModule {}