import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PeopleController } from '../src/modules/people/people.controller.js';
import { PeopleService } from '../src/modules/people/people.service.js';
import { SitesController } from '../src/modules/sites/sites.controller.js';
import { SitesService } from '../src/modules/sites/sites.service.js';

describe('People and Sites API (e2e)', () => {
  const people = [
    {
      _id: '650000000000000000000001',
      name: 'Avery Chen',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];
  const site = {
    _id: '660000000000000000000001',
    address: 'smallweb://field-notes',
    title: 'Field Notes',
    html: '<h1>Field Notes</h1>',
    textContent: 'Field Notes',
    authorId: people[0]._id,
  };
  const peopleService = {
    findAll: vi.fn(),
  };
  const sitesService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  };
  let app: Awaited<ReturnType<typeof createApp>>;

  async function createApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [PeopleController, SitesController],
      providers: [
        { provide: PeopleService, useValue: peopleService },
        { provide: SitesService, useValue: sitesService },
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

  it('GET /api/people returns the available people', async () => {
    peopleService.findAll.mockResolvedValue(people);

    await request(app.getHttpServer())
      .get('/api/people')
      .expect(200)
      .expect({ data: people });
  });

  it('GET /api/sites returns site summaries', async () => {
    sitesService.findAll.mockResolvedValue([site]);

    await request(app.getHttpServer())
      .get('/api/sites')
      .expect(200)
      .expect({ data: [site] });
  });

  it('GET /api/sites/:address retrieves an encoded internal address', async () => {
    sitesService.findOne.mockResolvedValue(site);

    await request(app.getHttpServer())
      .get(`/api/sites/${encodeURIComponent(site.address)}`)
      .expect(200)
      .expect({ data: site });

    expect(sitesService.findOne).toHaveBeenCalledWith(site.address);
  });

  it('GET /api/sites/:address returns the service error status', async () => {
    sitesService.findOne.mockRejectedValue(
      new NotFoundException('No stored site exists at smallweb://missing-page.'),
    );

    await request(app.getHttpServer())
      .get(`/api/sites/${encodeURIComponent('smallweb://missing-page')}`)
      .expect(404);

    sitesService.findOne.mockRejectedValue(
      new BadRequestException('Invalid internal address.'),
    );

    await request(app.getHttpServer())
      .get(`/api/sites/${encodeURIComponent('https://example.com')}`)
      .expect(400);
  });

  it('POST /api/sites publishes a valid site', async () => {
    sitesService.create.mockResolvedValue(site);

    await request(app.getHttpServer())
      .post('/api/sites')
      .send({
        address: 'SMALLWEB://field-notes',
        title: 'Field Notes',
        html: '<h1>Field Notes</h1>',
        authorId: people[0]._id,
      })
      .expect(201)
      .expect({ data: site });

    expect(sitesService.create).toHaveBeenCalledWith({
      address: 'SMALLWEB://field-notes',
      title: 'Field Notes',
      html: '<h1>Field Notes</h1>',
      authorId: people[0]._id,
    });
  });

  it('POST /api/sites rejects invalid DTO fields', async () => {
    await request(app.getHttpServer())
      .post('/api/sites')
      .send({
        address: 'https://example.com',
        title: '',
        html: '<p>Page</p>',
        authorId: 'not-an-object-id',
        unexpected: true,
      })
      .expect(400);

    expect(sitesService.create).not.toHaveBeenCalled();
  });

  it('POST /api/sites returns conflict and missing-author errors', async () => {
    const body = {
      address: 'smallweb://field-notes',
      title: 'Field Notes',
      html: '<p>Notes</p>',
      authorId: people[0]._id,
    };

    sitesService.create.mockRejectedValue(
      new ConflictException('A site with this address already exists.'),
    );
    await request(app.getHttpServer())
      .post('/api/sites')
      .send(body)
      .expect(409);

    sitesService.create.mockRejectedValue(
      new NotFoundException('The selected author does not exist.'),
    );
    await request(app.getHttpServer())
      .post('/api/sites')
      .send(body)
      .expect(404);
  });
});
