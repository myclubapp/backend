
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
export async function addMemberToHelferEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('Add Member to Helferevent');

  const {userId, eventId, schichtId, clubId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('HelfereventId: ' + eventId);
  logger.info('schichtId: ' + schichtId);
  logger.info('clubId: ' + clubId);

  const helferEvent = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).get();
  const helferSchicht = await db.collection('club').doc(clubId).collection('helferEvents').doc(eventId).collection('schichten').doc(schichtId).get();
  const clubData = await db.collection('club').doc(clubId).get();

  // berechne datum anhand eventdatum anhand threshold, welche in stunden angegeben wird
  const helferEventDatum = new Date(helferEvent.data()?.startDate);
  const helferEventDatumPlusThreshold = new Date(helferEventDatum.getTime() - clubData.data()?.helferThreshold * 60 * 60 * 1000);


  const userProfileRef = await db.collection('userProfile').doc(userId).get();
  if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushHelfer) {
    await sendPushNotificationByUserProfileId(
        userId,
        'Bestätigung Helferevent ' + helferEvent.data()?.name + ' - ' + helferSchicht.data()?.name,
        'Du hast dich für den Helferevent ' + helferEvent.data()?.name + ' - ' + helferSchicht.data()?.name + ' angemeldet.',
        {
          'type': 'helferEvent',
          'clubId': clubId,
          'id': helferEvent.id,
        },
    );
    await db.collection('mail').add({
      to: userProfileRef.data().email,
      template: {
        name: 'HelferEventConfirmation',
        data: {
          helferEventName: helferEvent.data()?.name,
          helferEventDescription: helferEvent.data()?.description,
          helferEventDatum: helferEvent.data()?.startDate,

          schichtName: helferSchicht.data()?.name,
          schichtStart: helferSchicht.data()?.timeFrom,
          schichtEnde: helferSchicht.data()?.timeTo,
          schichtPunkte: helferSchicht.data()?.points,

          abmeldefrist: helferEventDatumPlusThreshold,

          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  }
  return true;


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
