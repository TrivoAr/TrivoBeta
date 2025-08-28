// scripts/backfill-shortids.ts
import 'dotenv/config';
import { connectDB } from '../src/libs/mongodb';
import SalidaSocial from '../src/models/salidaSocial';
import { customAlphabet } from 'nanoid';

const nanoid8 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
const nanoid12 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

async function generateUniqueShortId() {
  for (let i = 0; i < 6; i++) {
    const candidate = nanoid8();
    const exists = await SalidaSocial.exists({ shortId: candidate });
    if (!exists) return candidate;
  }
  return nanoid12(); // fallback ultra improbable
}

async function main() {
  await connectDB();

  // 1) Documentos sin shortId (null/""/no existe)
  const missing = await SalidaSocial
    .find({
      $or: [
        { shortId: { $exists: false } },
        { shortId: null },
        { shortId: '' },
      ],
    })
    .select('_id')
    .lean();

  const ops: any[] = [];
  for (const doc of missing) {
    const code = await generateUniqueShortId();
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { shortId: code } },
      },
    });
  }

  // 2) (Opcional) Resolver duplicados si los hubiera
  const duplicates = await SalidaSocial.aggregate([
    { $match: { shortId: { $ne: null } } },
    { $group: { _id: '$shortId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const dup of duplicates) {
    const ids = dup.ids.slice(1); // deja el primero, re-asigna el resto
    for (const _id of ids) {
      const code = await generateUniqueShortId();
      ops.push({
        updateOne: { filter: { _id }, update: { $set: { shortId: code } } },
      });
    }
  }

  if (ops.length) {
    const res = await SalidaSocial.bulkWrite(ops);
    console.log(`Backfill listo. Modificados: ${res.modifiedCount}`);
  } else {
    console.log('No hay documentos para actualizar.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
