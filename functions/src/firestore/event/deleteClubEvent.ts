
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteClubEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteClubEvent');

  const clubId = event.params.clubId;
  const eventId = event.params.eventId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').get();
  for (const attendee of attendeesRef.docs) {
    await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').doc(attendee.id).delete();
  }

  return db.collection('club').doc(clubId).collection('events').doc(eventId).delete();
}
