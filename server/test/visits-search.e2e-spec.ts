import {
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SearchController } from '../src/modules/search/search.controller.js';
import { SearchService } from '../src/modules/search/search.service.js';
import { VisitsController } from '../src/modules/visits/visits.controller.js';
import { VisitsService } from '../src/modules/visits/visits.service.js';

describe('Visits and Search API (e2e)', () => {
  const personId = '650000000000000000000001';
  const visit = {
    _id: '670000000000000000000001',
    personId,
    address: 'smallweb://missing-page',
    title: 'Unavailable page',
    visitedAt: '2025-05-17T09:00:00.000Z',
    source: 'link',
  };
  const site = {
    _id: '660000000000000000000001',
    address: 'smallweb://field-notes',
    title: 'Field Notes',
    textContent: 'Notes about a neighborhood garden.',
  };
  const visitsService = {
    create: vi.fn(),
    findByPerson: vi.fn(),
  };
  const searchService = {
    search: vi.fn(),
  };
  let app: Awaited<ReturnType<typeof createApp>>;

  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [VisitsController, SearchController],
      providers: [
        { provide: VisitsService, useValue: visitsService },
        { provide: SearchService, useValue: searchService },
      ],
    }).compile();

    const nestApp = moduleRef.createNestApplication();
    nestApp.setGlobalPrefix('api');
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await nestApp.init();
    return nestApp;
  }

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/visits records a broken-address navigation arrival', async () => {
    visitsService.create.mockResolvedValue(visit);

    await request(app.getHttpServer())
      .post('/api/visits')
      .send({
        personId,
        address: 'smallweb://missing-page',
        source: 'link',
      })
      .expect(201)
      .expect({ data: visit });

    expect(visitsService.create).toHaveBeenCalledWith({
      personId,
      address: 'smallweb://missing-page',
      source: 'link',
    });
  });

  it('POST /api/visits rejects invalid person IDs, sources and extra fields', async () => {
    await request(app.getHttpServer())
      .post('/api/visits')
      .send({
        personId: 'not-an-object-id',
        address: 'smallweb://missing-page',
        source: 'external',
        unexpected: true,
      })
      .expect(400);

    expect(visitsService.create).not.toHaveBeenCalled();
  });

  it('GET /api/visits/:personId returns history and accepts a bounded limit', async () => {
    visitsService.findByPerson.mockResolvedValue([visit]);

    await request(app.getHttpServer())
      .get(`/api/visits/${personId}?limit=25`)
      .expect(200)
      .expect({ data: [visit] });

    expect(visitsService.findByPerson).toHaveBeenCalledWith(personId, 25);
  });

  it('GET /api/visits/:personId validates person IDs and limits', async () => {
    await request(app.getHttpServer())
      .get('/api/visits/not-an-object-id')
      .expect(400);

    await request(app.getHttpServer())
      .get(`/api/visits/${personId}?limit=101`)
      .expect(400);

    expect(visitsService.findByPerson).not.toHaveBeenCalled();
  });

  it('GET /api/visits/:personId returns not found for an unknown person', async () => {
    visitsService.findByPerson.mockRejectedValue(
      new NotFoundException('The selected person does not exist.'),
    );

    await request(app.getHttpServer())
      .get(`/api/visits/${personId}`)
      .expect(404);
  });

  it('GET /api/search?q=... returns matching site results', async () => {
    searchService.search.mockResolvedValue([site]);

    await request(app.getHttpServer())
      .get('/api/search?q=garden')
      .expect(200)
      .expect({ data: [site] });

    expect(searchService.search).toHaveBeenCalledWith('garden');
  });

  it('GET /api/search handles empty and no-result queries', async () => {
    searchService.search.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/api/search?q=%20%20')
      .expect(200)
      .expect({ data: [] });

    await request(app.getHttpServer())
      .get('/api/search?q=missing')
      .expect(200)
      .expect({ data: [] });
  });

  it('GET /api/search validates query length', async () => {
    await request(app.getHttpServer())
      .get(`/api/search?q=${'a'.repeat(101)}`)
      .expect(400);

    expect(searchService.search).not.toHaveBeenCalled();
  });
});
