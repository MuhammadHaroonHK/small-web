import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PeopleModule } from './modules/people/people.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { SitesModule } from './modules/sites/sites.module.js';
import { VisitsModule } from './modules/visits/visits.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI')?.trim();

        if (!uri) {
          throw new Error(
            'MONGODB_URI is missing. Set it in server/.env before starting the API.',
          );
        }

        return {
          uri,
          retryAttempts: 3,
          retryDelay: 1000,
          serverSelectionTimeoutMS: 5000,
          connectionErrorFactory: () =>
            new Error(
              'Unable to connect to MongoDB. Check that the database is running and MONGODB_URI in server/.env is valid.',
            ),
        };
      },
    }),
    PeopleModule,
    SitesModule,
    VisitsModule,
    SearchModule,
  ],
})
export class AppModule {}
