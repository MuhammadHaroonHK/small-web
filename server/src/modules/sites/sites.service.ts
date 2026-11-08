import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { CreateSiteDto } from './dto/create-site.dto.js';
import { Site } from './schemas/site.schema.js';
import {
  normalizeSiteAddress,
  sanitizeSiteContent,
} from './site-content.util.js';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<Site>,
    @InjectModel(Person.name)
    private readonly personModel: Model<Person>,
  ) {}

  findAll() {
    return this.siteModel
      .find({}, { address: 1, title: 1, authorId: 1, createdAt: 1 })
      .sort({ address: 1 })
      .lean()
      .exec();
  }

  async findOne(address: string) {
    const normalizedAddress = normalizeSiteAddress(address);
    const site = await this.siteModel
      .findOne({ address: normalizedAddress })
      .lean()
      .exec();

    if (!site) {
      throw new NotFoundException(
        `No stored site exists at ${normalizedAddress}.`,
      );
    }

    return site;
  }

  async create(createSiteDto: CreateSiteDto) {
    const address = normalizeSiteAddress(createSiteDto.address);
    const authorId = new Types.ObjectId(createSiteDto.authorId);
    const authorExists = await this.personModel.exists({ _id: authorId });

    if (!authorExists) {
      throw new NotFoundException('The selected author does not exist.');
    }

    const { html, textContent } = sanitizeSiteContent(createSiteDto.html);

    try {
      const site = new this.siteModel({
        address,
        title: createSiteDto.title.trim(),
        html,
        textContent,
        authorId,
      });

      return await site.save();
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          'A site with this address has already been published.',
        );
      }

      throw error;
    }
  }
}
