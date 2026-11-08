import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Person } from '../people/schemas/person.schema.js';
import { Site } from './schemas/site.schema.js';
import { SitesService } from './sites.service.js';
import { normalizeSiteAddress, sanitizeSiteContent } from './site-content.util.js';

function createQuery<T>(result: T) {
  const query = {
    sort: vi.fn(),
    lean: vi.fn(),
    exec: vi.fn().mockResolvedValue(result),
  };

  query.sort.mockReturnValue(query);
  query.lean.mockReturnValue(query);
  return query;
}

describe('SitesService', () => {
  const siteDocument = {
    save: vi.fn(),
  };
  const siteModel = vi.fn(function (this: typeof siteDocument) {
    return siteDocument;
  }) as unknown as {
    new (data: Record<string, unknown>): typeof siteDocument;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  const personModel = {
    exists: vi.fn(),
  };
  let service: SitesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: getModelToken(Site.name), useValue: siteModel },
        { provide: getModelToken(Person.name), useValue: personModel },
      ],
    }).compile();
    service = moduleRef.get(SitesService);
  });

  it('normalizes and validates only internal site addresses', () => {
    expect(normalizeSiteAddress(' SMALLWEB://Field-Notes/ ')).toBe(
      'smallweb://field-notes',
    );
    expect(() => normalizeSiteAddress('https://example.com')).toThrow(
      'Address must use the internal format',
    );
  });

  it('removes unsafe markup and derives searchable plain text', () => {
    const content = sanitizeSiteContent(
      '<h1>Garden</h1><script>alert(1)</script><img src="https://example.com/a.png"><p onclick="alert(1)">Fresh herbs</p><a href="javascript:alert(1)">unsafe link</a>',
    );

    expect(content.html).toContain('<h1>Garden</h1>');
    expect(content.html).not.toMatch(/script|onclick|img|javascript:/i);
    expect(content.textContent).toContain('Garden');
    expect(content.textContent).toContain('Fresh herbs');
  });

  it('rejects HTML without readable text after sanitizing', () => {
    expect(() =>
      sanitizeSiteContent('<script>alert(1)</script><img src="x">'),
    ).toThrow('HTML must contain readable text');
  });

  it('returns a site by normalized address', async () => {
    const site = { address: 'smallweb://field-notes' };
    const query = createQuery(site);
    siteModel.findOne = vi.fn().mockReturnValue(query);

    await expect(service.findOne('SMALLWEB://Field-Notes')).resolves.toBe(site);
    expect(siteModel.findOne).toHaveBeenCalledWith({
      address: 'smallweb://field-notes',
    });
  });

  it('reports missing sites and authors', async () => {
    siteModel.findOne = vi.fn().mockReturnValue(createQuery(null));
    await expect(service.findOne('smallweb://missing-page')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    personModel.exists.mockResolvedValue(null);
    await expect(
      service.create({
        address: 'smallweb://new-page',
        title: 'New page',
        html: '<p>Content</p>',
        authorId: '650000000000000000000001',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores sanitized markup and extracted text, and translates duplicate-key errors', async () => {
    personModel.exists.mockResolvedValue({ _id: '650000000000000000000001' });
    siteDocument.save.mockResolvedValue({ address: 'smallweb://new-page' });

    await expect(
      service.create({
        address: 'SMALLWEB://New-Page',
        title: 'New page',
        html: '<h1>Safe</h1><script>bad()</script>',
        authorId: '650000000000000000000001',
      }),
    ).resolves.toEqual({ address: 'smallweb://new-page' });

    const storedSite = siteModel.mock.calls.at(-1)?.[0] as Record<
      string,
      unknown
    >;
    expect(storedSite.html).toBe('<h1>Safe</h1>');
    expect(storedSite.textContent).toBe('Safe');

    siteDocument.save.mockRejectedValue({ code: 11000 });
    await expect(
      service.create({
        address: 'smallweb://new-page',
        title: 'Duplicate page',
        html: '<p>Content</p>',
        authorId: '650000000000000000000001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
