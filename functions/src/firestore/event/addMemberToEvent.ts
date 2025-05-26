
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {Change, FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
export async function addMemberToEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('Add Member to Event');

  const {userId, eventId, clubId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('EventId: ' + eventId);
  logger.info('clubId: ' + clubId);
  logger.info('Status: ' + event.data?.data().status);

  const veranstaltung = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();
  const clubData = await db.collection('club').doc(clubId).get();

  // berechne datum anhand eventdatum anhand threshold, welche in stunden angegeben wird
  const eventDatum = new Date(veranstaltung.data()?.startDate); // format 2025-01-11T10:00:00.000Z
  const eventDatumString = eventDatum.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
  const eventThreshold = clubData.data()?.eventThreshold; // in Stunden
  const eventDatumPlusThreshold = new Date(eventDatum.getTime() - eventThreshold * 60 * 60 * 1000);
  const eventDatumPlusThresholdString = eventDatumPlusThreshold.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});

  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  if (event.data?.data().status) {
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushHelfer) {
      await sendPushNotificationByUserProfileId(
          userId,
          'Bestätigung Event ' + veranstaltung.data()?.name + ' - ' + veranstaltung.data()?.name,
          'Du hast dich für den Event ' + veranstaltung.data()?.name + ' angemeldet.',
          {
            'type': 'clubEvent',
            'clubId': clubId,
            'id': veranstaltung.id,
          },
      );
    }
    if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
      await db.collection('mail').add({
        to: userProfileRef.data().email,
        template: {
          name: 'EventAddMemberConfirmation',
          data: {
            eventName: veranstaltung.data()?.name,
            eventDescription: veranstaltung.data()?.description,
            eventDatum: eventDatumString,
            eventOrt: veranstaltung.data()?.location,
            abmeldefrist: eventDatumPlusThresholdString,

            firstName: userProfileRef.data()?.firstName,
            lastName: userProfileRef.data()?.lastName,
          },
        },
      });
    }
  }
  return true;
}
export async function changeStatusMemberEvent(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('Change Status of Member for Event');

  const {userId, eventId, clubId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('EventId: ' + eventId);
  logger.info('clubId: ' + clubId);
  logger.info('Status Neuer: ' + event.data?.after.data()?.status);
  logger.info('Status Alte: ' + event.data?.before.data()?.status);

  const veranstaltung = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();
  const clubData = await db.collection('club').doc(clubId).get();

  // berechne datum anhand eventdatum anhand threshold, welche in stunden angegeben wird
  const eventDatum = new Date(veranstaltung.data()?.startDate); // format 2025-01-11T10:00:00.000Z
  const eventDatumString = eventDatum.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
  const eventThreshold = clubData.data()?.eventThreshold; // in Stunden
  const eventDatumPlusThreshold = new Date(eventDatum.getTime() - eventThreshold * 60 * 60 * 1000);
  const eventDatumPlusThresholdString = eventDatumPlusThreshold.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});

  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  if (event.data?.after.data()?.status) {
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      await sendPushNotificationByUserProfileId(
          userId,
          'Bestätigung Event ' + veranstaltung.data()?.name,
          'Du hast dich für den Event ' + veranstaltung.data()?.name + ' angemeldet.',
          {
            'type': 'clubEvent',
            'clubId': clubId,
            'id': veranstaltung.id,
          },
      );
    }
    if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
      await db.collection('mail').add({
        to: userProfileRef.data().email,
        template: {
          name: 'EventAddMemberConfirmation',
          data: {
            eventName: veranstaltung.data()?.name,
            eventDescription: veranstaltung.data()?.description,
            eventDatum: eventDatumString,
            eventOrt: veranstaltung.data()?.location,

            abmeldefrist: eventDatumPlusThresholdString,

            firstName: userProfileRef.data()?.firstName,
            lastName: userProfileRef.data()?.lastName,
          },
        },
      });
    }
  }
  return true;
}
