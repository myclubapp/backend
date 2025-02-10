
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {sendPushNotificationByUserProfileId} from '../../utils/push';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function confirmHelferEvent(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('confirmHelferEvent /club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}');
  const clubId = event.params.clubId;
  const eventId = event.params.eventId;
  const schichtId = event.params.schichtId;
  const userId = event.params.userId;

  if (event.data?.after.data()?.confirmed === true && event.data?.before.data()?.confirmed !== true) {
    logger.info('confirmed');

    const userRef = await db.collection('userProfile').doc(userId).get();
    const clubRef = await db.collection('club').doc(clubId).get();
    const helferEventRef = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).get();
    const schichtRef = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').doc(schichtId).get();

    const helferPunktRef = await db.collection('club').doc(clubId).collection('helferPunkte').add({
      ...event.data?.after.data(),
      userId: userId,
      userRef: userRef.ref,
      clubId: clubRef.id,
      clubRef: clubRef.ref,
      name: helferEventRef.data().name,
      eventRef: helferEventRef.ref,
      eventName: helferEventRef.data().name,
      eventDate: helferEventRef.data().date,
      points: event.data?.after.data()?.points || 1,

      schichtRef: schichtRef.ref,
      schichtName: schichtRef.data()?.name,
      schichtTimeFrom: schichtRef.data()?.timeFrom,
      schichtTimeTo: schichtRef.data()?.timeTo,
    });

    // Send Push to Member
    const userProfileRef = await db.collection('userProfile').doc(userRef.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      await sendPushNotificationByUserProfileId(
          userRef.id,
          'Helfereinsatz bestätigt',
          'Dein Helfereinsatz am ' + helferEventRef.data().name + ' für die Schicht: ' + schichtRef.data().name + ' wurde bestätigt',
          {
            'type': 'helferPunkt',
            'id': helferPunktRef.id,
          });
    }

    // Set Helferpunkt Ref to HelferEinsatz
    return db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').doc(schichtId).collection('attendees').doc(userId).set({
      helferPunktRef: helferPunktRef.ref,
      helferPunktId: helferPunktRef.id,
    },
    {
      merge: true,
    });
  }
}
