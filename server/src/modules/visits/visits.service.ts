import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { normalizeSiteAddress } from '../sites/site-content.util.js';
import { CreateVisitDto } from './dto/create-visit.dto.js';
import { Visit } from './schemas/visit.schema.js';

const DEFAULT_HISTORY_LIMIT = 50;

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name)
    private readonly visitModel: Model<Visit>,
    @InjectModel(Person.name)
    private readonly personModel: Model<Person>,
  ) {}

  async create(createVisitDto: CreateVisitDto) {
    const personId = new Types.ObjectId(createVisitDto.personId);
    const personExists = await this.personModel.exists({ _id: personId });

    if (!personExists) {
      throw new NotFoundException('The selected person does not exist.');
    }

    const visit = new this.visitModel({
      personId,
      address: normalizeSiteAddress(createVisitDto.address),
      title: createVisitDto.title?.trim() || 'Unavailable page',
      visitedAt: new Date(),
      source: createVisitDto.source,
    });

    return visit.save();
  }

  async findByPerson(personId: string, limit = DEFAULT_HISTORY_LIMIT) {
    const personObjectId = new Types.ObjectId(personId);
    const person = await this.personModel.exists({ _id: personObjectId });

    if (!person) {
      throw new NotFoundException('The selected person does not exist.');
    }

    return this.visitModel
      .find({ personId: personObjectId })
      .select({ personId: 1, address: 1, title: 1, visitedAt: 1, source: 1 })
      .sort({ visitedAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
