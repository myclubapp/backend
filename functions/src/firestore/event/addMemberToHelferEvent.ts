
/* eslint-disable max-len */
// import firebaseDAO from '../../firebaseSingleton.js';
// import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
// const db = firebaseDAO.instance.db;
export async function addMemberToHelferEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('Add Member to Helferevent');

  const {userId, eventId, schichtId, clubId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('HelfereventId: ' + eventId);
  logger.info('schichtId: ' + schichtId);
  logger.info('clubId: ' + clubId);
  /* const eventData = event.data?.data();
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
  */
}
