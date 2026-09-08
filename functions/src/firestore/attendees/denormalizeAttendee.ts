/* eslint-disable max-len */
import {logger} from 'firebase-functions';
import {FirestoreEvent, Change, DocumentSnapshot, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import firebaseDAO from '../../firebaseSingleton.js';

const db = firebaseDAO.instance.db;

/** Felder aus dem Profil, die auf Teilnehmer- und Mitglieder-Dokumente kopiert werden. */
export const PROFILE_FIELDS = ['firstName', 'lastName', 'profilePicture'] as const;
const BATCH_SIZE = 400;

/**
 * Kopie der Profildaten für ein Teilnehmer- oder Mitglieder-Dokument.
 * `id` ist die uid und erlaubt Collection-Group-Abfragen (Index `attendees.id` und `members.id`).
 */
export function profileSummary(uid: string, profile: Record<string, unknown> | undefined) {
  return {
    id: uid,
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    profilePicture: profile?.profilePicture ?? null,
  };
}

function hasProfileSummary(data: Record<string, unknown>): boolean {
  return 'id' in data && 'firstName' in data && 'lastName' in data;
}

/**
 * Ergänzt Vor- und Nachname sowie Profilbild auf einem Teilnehmer- oder Mitglieder-Dokument.
 * Läuft als onDocumentWritten, weil die App den Status mit setDoc ohne merge schreibt und die
 * Felder dabei wieder entfernt. Der Guard verhindert eine Schleife nach dem eigenen Schreibvorgang.
 */
export async function denormalizeAttendee(event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) {
  const after = event.data?.after;
  if (!after || !after.exists) {
    return false;
  }
  const data = after.data() || {};
  if (hasProfileSummary(data)) {
    return false;
  }
  const uid = event.params.uid;
  const profile = await db.collection('userProfile').doc(uid).get();
  if (!profile.exists) {
    logger.warn(`denormalizeAttendee: no profile for ${uid} (${after.ref.path})`);
    return false;
  }
  await after.ref.set(profileSummary(uid, profile.data()), {merge: true});
  return true;
}

/**
 * Zieht Namens- oder Bildänderungen im Profil auf alle Teilnehmer- und Club-Mitglieder-Dokumente nach.
 */
export async function syncProfileNames(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  const before = event.data?.before.data() || {};
  const after = event.data?.after.data() || {};
  const changed = PROFILE_FIELDS.some((field) => (before[field] ?? null) !== (after[field] ?? null));
  if (!changed) {
    return false;
  }
  const uid = event.params.userId;
  const summary = profileSummary(uid, after);
  const snapshots = [
    await db.collectionGroup('attendees').where('id', '==', uid).get(),
    await db.collectionGroup('members').where('id', '==', uid).get(),
  ];

  let batch = db.batch();
  let pending = 0;
  let total = 0;
  for (const snapshot of snapshots) {
    for (const doc of snapshot.docs) {
      batch.set(doc.ref, summary, {merge: true});
      pending++;
      total++;
      if (pending === BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }
  if (pending > 0) {
    await batch.commit();
  }
  logger.info(`syncProfileNames: profile ${uid} synced to ${total} document(s)`);
  return true;
}
