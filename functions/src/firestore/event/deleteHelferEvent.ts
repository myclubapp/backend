
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteHelferEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteHelferEvent');

  const clubId = event.params.clubId;
  const eventId = event.params.eventId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('attendees').get();
  for (const attendee of attendeesRef.docs) {
    await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('attendees').doc(attendee.id).delete();

    // delete Helferpunkte as well
    if (attendee.data().confirmed) {
      await db.collection('club').doc(clubId).collection('helferPunkte').doc(attendee.data().HelferPunktId).delete();
    }
  }

  const schichtenRef = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').get();
  for (const schicht of schichtenRef.docs) {
    const attendeesRef = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').doc(schicht.id).collection('attendees').get();
    for (const attendee of attendeesRef.docs) {
      await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').doc(schicht.id).collection('attendees').doc(attendee.id).delete();
      // delete Helferpunkte as well
      if (attendee.data().confirmed) {
        await db.collection('club').doc(clubId).collection('helferPunkte').doc(attendee.data().HelferPunktId).delete();
      }
    }
  }
  return db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).delete();
}
