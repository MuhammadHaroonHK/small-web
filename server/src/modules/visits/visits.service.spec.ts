import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Person } from '../people/schemas/person.schema.js';
import { Visit } from './schemas/visit.schema.js';
import { VisitsService } from './visits.service.js';

describe('VisitsService', () => {
  const savedVisit = {
    save: vi.fn(),
  };
  const visitModel = vi.fn(function (this: typeof savedVisit) {
    return savedVisit;
  }) as unknown as {
    new (data: Record<string, unknown>): typeof savedVisit;
    find: ReturnType<typeof vi.fn>;
  };
  const personModel = {
    exists: vi.fn(),
  };
  let service: VisitsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: getModelToken(Visit.name), useValue: visitModel },
        { provide: getModelToken(Person.name), useValue: personModel },
      ],
    }).compile();
    service = moduleRef.get(VisitsService);
  });

  it('records an internal address, source and timestamp without requiring a Site', async () => {
    personModel.exists.mockResolvedValue({ _id: '650000000000000000000001' });
    savedVisit.save.mockResolvedValue({ address: 'smallweb://missing-page' });

    await expect(
      service.create({
        personId: '650000000000000000000001',
        address: 'SMALLWEB://Missing-Page',
        source: 'link',
      }),
    ).resolves.toEqual({ address: 'smallweb://missing-page' });

    const visit = visitModel.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(visit.address).toBe('smallweb://missing-page');
    expect(visit.title).toBe('Unavailable page');
    expect(visit.visitedAt).toBeInstanceOf(Date);
    expect(visit.source).toBe('link');
    expect(personModel.exists).toHaveBeenCalledOnce();
  });

  it('rejects visits for unknown people', async () => {
    personModel.exists.mockResolvedValue(null);

    await expect(
      service.create({
        personId: '650000000000000000000001',
        address: 'smallweb://missing-page',
        source: 'typed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(savedVisit.save).not.toHaveBeenCalled();
  });

  it('queries bounded person history newest first', async () => {
    personModel.exists.mockResolvedValue({ _id: '650000000000000000000001' });
    const query = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn(),
      exec: vi.fn().mockResolvedValue([]),
    };
    query.select.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.lean.mockReturnValue(query);
    visitModel.find = vi.fn().mockReturnValue(query);

    await expect(
      service.findByPerson('650000000000000000000001', 25),
    ).resolves.toEqual([]);

    expect(query.sort).toHaveBeenCalledWith({ visitedAt: -1, _id: -1 });
    expect(query.limit).toHaveBeenCalledWith(25);
  });

  it('rejects history requests for unknown people', async () => {
    personModel.exists.mockResolvedValue(null);

    await expect(
      service.findByPerson('650000000000000000000001'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(visitModel.find).not.toHaveBeenCalled();
  });
});
