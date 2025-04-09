
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
  const helferEventDatum = new Date(helferEvent.data()?.startDate); // format 2025-01-11T10:00:00.000Z
  const helferEventDatumString = helferEventDatum.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
  const helferEventThreshold = clubData.data()?.helferThreshold; // in Stunden
  const helferEventDatumPlusThreshold = new Date(helferEventDatum.getTime() - helferEventThreshold * 60 * 60 * 1000);
  const helferEventDatumPlusThresholdString = helferEventDatumPlusThreshold.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});

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
          helferEventDatum: helferEventDatumString,
          helferEventOrt: helferEvent.data()?.location,

          schichtName: helferSchicht.data()?.name,
          schichtStart: helferSchicht.data()?.timeFrom,
          schichtEnde: helferSchicht.data()?.timeTo,
          schichtPunkte: helferSchicht.data()?.points,

          abmeldefrist: helferEventDatumPlusThresholdString,

          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  }
  return true;
}
