import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Site } from '../sites/schemas/site.schema.js';
import { SearchService } from './search.service.js';

describe('SearchService', () => {
  const siteModel = {
    find: vi.fn(),
  };
  let service: SearchService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(Site.name), useValue: siteModel },
      ],
    }).compile();
    service = moduleRef.get(SearchService);
  });

  it('returns no results for a blank query without querying MongoDB', async () => {
    await expect(service.search('  ')).resolves.toEqual([]);
    await expect(service.search()).resolves.toEqual([]);
    expect(siteModel.find).not.toHaveBeenCalled();
  });

  it('runs a ranked MongoDB text search over the indexed site fields', async () => {
    const results = [
      {
        address: 'smallweb://field-notes',
        title: 'Field Notes',
        textContent: 'Notes about a neighborhood garden.',
      },
    ];
    const query = {
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn(),
      exec: vi.fn().mockResolvedValue(results),
    };
    query.sort.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.lean.mockReturnValue(query);
    siteModel.find.mockReturnValue(query);

    await expect(service.search('  garden  ')).resolves.toBe(results);
    expect(siteModel.find).toHaveBeenCalledWith(
      { $text: { $search: 'garden' } },
      {
        address: 1,
        title: 1,
        textContent: 1,
        score: { $meta: 'textScore' },
      },
    );
    expect(query.sort).toHaveBeenCalledWith({
      score: { $meta: 'textScore' },
      title: 1,
    });
    expect(query.limit).toHaveBeenCalledWith(50);
  });
});
