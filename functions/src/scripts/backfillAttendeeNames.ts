/* eslint-disable max-len */
/**
 * Einmalig nach Aufgabe E: schreibt id, firstName, lastName und profilePicture auf alle
 * Teilnehmer-Dokumente (Collection Group `attendees`) und auf club/{clubId}/members/{uid}.
 * Dokumente, die diese Felder bereits tragen, werden übersprungen.
 *
 * Aufruf im Ordner functions nach `npm run build`, mit Application Default Credentials:
 *   GOOGLE_CLOUD_PROJECT=myclubmanagement node lib/scripts/backfillAttendeeNames.js [--apply]
 * Ohne --apply wird nur gezählt.
 */
import admin from 'firebase-admin';
import firebaseDAO from '../firebaseSingleton.js';
import {profileSummary} from '../firestore/attendees/denormalizeAttendee.js';

const db = firebaseDAO.instance.db;
const apply = process.argv.includes('--apply');
const PAGE_SIZE = 500;
const BATCH_SIZE = 400;

type ProfileData = Record<string, unknown> | null;
const profiles = new Map<string, ProfileData>();

async function loadProfile(uid: string): Promise<ProfileData> {
  if (!profiles.has(uid)) {
    const snapshot = await db.collection('userProfile').doc(uid).get();
    profiles.set(uid, snapshot.exists ? snapshot.data() : null);
  }
  return profiles.get(uid) ?? null;
}

function isClubMember(path: string): boolean {
  return path.startsWith('club/');
}

async function main() {
  const stats = {scanned: 0, updated: 0, skipped: 0, missingProfile: 0, ignored: 0};
  let batch = db.batch();
  let pending = 0;

  for (const group of ['attendees', 'members']) {
    let query = db.collectionGroup(group).orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE);
    for (;;) {
      const page = await query.get();
      if (page.empty) break;
      for (const doc of page.docs) {
        stats.scanned++;
        if (group === 'members' && !isClubMember(doc.ref.path)) {
          stats.ignored++;
          continue;
        }
        const data = doc.data() || {};
        if ('id' in data && 'firstName' in data && 'lastName' in data) {
          stats.skipped++;
          continue;
        }
        const profile = await loadProfile(doc.id);
        if (!profile) {
          stats.missingProfile++;
          continue;
        }
        stats.updated++;
        if (!apply) continue;
        batch.set(doc.ref, profileSummary(doc.id, profile), {merge: true});
        pending++;
        if (pending === BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          pending = 0;
        }
      }
      console.log(`${group}: ${stats.scanned} scanned so far`);
      query = query.startAfter(page.docs[page.docs.length - 1]);
    }
  }
  if (apply && pending > 0) {
    await batch.commit();
  }
  console.log(JSON.stringify(stats, null, 2));
  if (!apply) {
    console.log('dry run, nothing written (use --apply)');
  }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
