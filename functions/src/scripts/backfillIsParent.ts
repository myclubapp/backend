/* eslint-disable max-len */
/**
 * Einmalig nach Aufgabe B: setzt `isParent: true` auf allen Profilen, die in mindestens einem Club
 * unter club/{clubId}/parents/{uid} eingetragen sind.
 *
 * Aufruf im Ordner functions nach `npm run build`, mit Application Default Credentials:
 *   GOOGLE_CLOUD_PROJECT=myclubmanagement node lib/scripts/backfillIsParent.js [--apply]
 * Ohne --apply werden die betroffenen Profile nur aufgelistet.
 */
import firebaseDAO from '../firebaseSingleton.js';

const db = firebaseDAO.instance.db;
const apply = process.argv.includes('--apply');
const BATCH_SIZE = 400;

async function main() {
  const parents = await db.collectionGroup('parents').get();
  const uids = new Set<string>();
  for (const doc of parents.docs) {
    // userProfile/{uid}/parents/{parentId} (Eltern eines Kindes) überspringen, nur club/{clubId}/parents/{uid}
    if (doc.ref.parent.parent?.parent?.id !== 'club') continue;
    uids.add(doc.id);
  }
  console.log(`${parents.size} parents document(s) scanned, ${uids.size} distinct club parent profile(s)`);
  if (!apply) {
    console.log([...uids].join('\n'));
    console.log('dry run, nothing written (use --apply)');
    return;
  }
  let batch = db.batch();
  let pending = 0;
  let written = 0;
  for (const uid of uids) {
    batch.set(db.collection('userProfile').doc(uid), {isParent: true}, {merge: true});
    pending++;
    written++;
    if (pending === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) {
    await batch.commit();
  }
  console.log(`updated ${written} profile(s)`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
