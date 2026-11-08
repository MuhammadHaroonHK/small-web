import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from '../people/schemas/person.schema.js';
import { Visit, VisitSchema } from './schemas/visit.schema.js';
import { VisitsController } from './visits.controller.js';
import { VisitsService } from './visits.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Visit.name, schema: VisitSchema },
    ]),
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
