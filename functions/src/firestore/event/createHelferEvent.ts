
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
export async function createHelferEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('CREATE Helferevent');

  const {userId, eventId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('HelfereventId: ' + eventId);

  const eventData = event.data?.data();
  const clubRef = await db.collection('club').doc(eventData?.clubId).get();
  logger.info(clubRef.id);

  const schichten = eventData?.schichten;
  delete eventData?.schichten;

  // create helferevent
  const newHelferEventRef = await db.collection('club').doc(clubRef.id).collection('helferEvents').add({
    ...eventData,
  });

  // if schichten, create them as well
  for (const schicht of schichten) {
    const newHelferSchicht = await db.collection('club').doc(clubRef.id).collection('helferEvents').doc(newHelferEventRef.id).collection('schichten').add({
      ...schicht,
    });
    logger.info('new schicht added: ' + newHelferSchicht.id);
  }

  logger.info('New Helferevent created: ' + newHelferEventRef.id);
  return db.collection('userProfile').doc(userId).collection('helferEvents').doc(eventId).delete();
}

export async function createNotificationHelferEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const clubId = event.params.clubId;
  const eventId = event.params.eventId;
  logger.info(clubId, eventId);

  const helferEvent = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).get();
  const clubMembersRef = await db.collection('club').doc(clubId).collection('members').get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection('userProfile').doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushHelfer) {
      await sendPushNotificationByUserProfileId(
          clubMember.id,
          'Neuer Helferevent verfügbar: ',
          helferEvent.data()?.name + ' - ' + helferEvent.data()?.description,
          {
            'type': 'helferEvent',
            'clubId': clubId,
            'id': helferEvent.id,
          },
      );
    }
  }
}
