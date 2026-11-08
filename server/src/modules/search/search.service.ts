import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site } from '../sites/schemas/site.schema.js';

const SEARCH_RESULT_LIMIT = 50;

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<Site>,
  ) {}

  search(query?: string) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      return Promise.resolve([]);
    }

    return this.siteModel
      .find(
        { $text: { $search: normalizedQuery } },
        {
          address: 1,
          title: 1,
          textContent: 1,
          score: { $meta: 'textScore' },
        },
      )
      .sort({ score: { $meta: 'textScore' }, title: 1 })
      .limit(SEARCH_RESULT_LIMIT)
      .lean()
      .exec();
  }
}
