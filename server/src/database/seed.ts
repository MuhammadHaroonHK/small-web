import mongoose, { Types } from 'mongoose';
import { Person, PersonSchema } from '../modules/people/schemas/person.schema.js';
import { Site, SiteSchema } from '../modules/sites/schemas/site.schema.js';
import { Visit, VisitSchema } from '../modules/visits/schemas/visit.schema.js';
import { seedPeople, seedSites, seedVisits } from './seed-data.js';

async function seedDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Set it in server/.env before running npm run seed.',
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const peopleModel = mongoose.model(Person.name, PersonSchema);
    const sitesModel = mongoose.model(Site.name, SiteSchema);
    const visitsModel = mongoose.model(Visit.name, VisitSchema);

    await Promise.all([
      peopleModel.createIndexes(),
      sitesModel.createIndexes(),
      visitsModel.createIndexes(),
    ]);

    await peopleModel.bulkWrite(
      seedPeople.map(({ id, name }) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { $set: { name } },
          upsert: true,
        },
      })),
    );

    await sitesModel.bulkWrite(
      seedSites.map(({ id, ...site }) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: {
            $set: {
              ...site,
              authorId: new Types.ObjectId(site.authorId),
            },
          },
          upsert: true,
        },
      })),
    );

    await visitsModel.bulkWrite(
      seedVisits.map((visit, index) => ({
        updateOne: {
          filter: {
            _id: new Types.ObjectId(
              (0x670000000000000000000000n + BigInt(index + 1))
                .toString(16)
                .padStart(24, '0'),
            ),
          },
          update: {
            $set: {
              personId: new Types.ObjectId(visit.personId),
              address: visit.address,
              title: visit.title,
              visitedAt: new Date(visit.time),
              source: visit.source,
            },
          },
          upsert: true,
        },
      })),
    );

    const visitIds = seedVisits.map((_, index) =>
      new Types.ObjectId(
        (0x670000000000000000000000n + BigInt(index + 1))
          .toString(16)
          .padStart(24, '0'),
      ),
    );
    const [seededPeople, seededSites, seededVisits, totalPeople, totalSites, totalVisits] =
      await Promise.all([
        peopleModel.countDocuments({
          _id: { $in: seedPeople.map(({ id }) => new Types.ObjectId(id)) },
        }),
        sitesModel.countDocuments({
          _id: { $in: seedSites.map(({ id }) => new Types.ObjectId(id)) },
        }),
        visitsModel.countDocuments({ _id: { $in: visitIds } }),
        peopleModel.countDocuments(),
        sitesModel.countDocuments(),
        visitsModel.countDocuments(),
      ]);

    console.log(
      `Seeded ${seededPeople} people, ${seededSites} sites, and ${seededVisits} visits. ` +
        `Collection totals: ${totalPeople} people, ${totalSites} sites, and ${totalVisits} visits.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

void seedDatabase().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown database seeding error.';
  console.error(`Database seeding failed: ${message}`);
  process.exitCode = 1;
});
