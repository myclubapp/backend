/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {Timestamp} from 'firebase-admin/firestore';
const db = firebaseDAO.instance.db;

export async function changeClubEvent(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeClubEvent');
  const {clubId, eventId} = event.params;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Behandlung von Event-Absagen
  if (afterData?.cancelled === true && (beforeData?.cancelled === false || beforeData?.cancelled === undefined)) {
    logger.info('Event cancelled');
    if (afterData) {
      await handleEventCancellation(clubId, eventId, afterData);
    }
  }

  // Behandlung von Event-Remindern
  if (afterData?.lastReminderSent === typeof(Timestamp) && (beforeData?.lastReminderSent < afterData?.lastReminderSent || beforeData?.lastReminderSent === undefined)) {
    logger.info('Event reminder sent');
    if (afterData) {
      await handleEventReminder(clubId, eventId, afterData);
    }
  }

  /*  // Behandlung von Event-Änderungen
    if (hasEventDetailsChanged(beforeData, afterData)) {
      logger.info('Event details changed');
      if (afterData) {
        await handleEventChanges(clubId, eventId, beforeData, afterData);
      }
    }
  */

  return true;
}

async function handleEventCancellation(clubId: string, eventId: string, eventData: any) {
  const attendeesRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').get();
  const clubRef = await db.collection('club').doc(clubId).get();
  const eventRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();

  for (const attendee of attendeesRef.docs) {
    if (attendee.data().status !== false) {
      const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
        await sendPushNotificationByUserProfileId(attendee.id,
            'Event ' + eventData.name + ' vom ' + eventData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' wurde abgesagt.',
            'Begründung: ' + eventData.cancelledReason,
            {
              'type': 'clubEvent',
              'clubId': clubRef.id,
              'id': eventRef.id,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        await db.collection('mail').add({
          to: userProfileRef.data().email,
          template: {
            name: 'ClubEventCancelled',
            data: {
              clubName: clubRef.data().name,
              firstName: userProfileRef.data()?.firstName,
              lastName: userProfileRef.data()?.lastName,
              eventName: eventData.name,
              eventDescription: eventData.description,
              eventOrt: eventData.location,
              eventDatum: eventData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
              absageGrund: eventData.cancelledReason,
            },
          },
        });
      }
    }
  }
}

async function handleEventReminder(clubId: string, eventId: string, eventData: any) {
  const attendeesRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').get();
  const clubRef = await db.collection('club').doc(clubId).get();
  const eventRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();

  for (const attendee of attendeesRef.docs) {
    if (attendee.data().status !== false) {
      const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
        await sendPushNotificationByUserProfileId(attendee.id,
            'Erinnerung: Event ' + eventData.name,
            'Das Event findet morgen statt. Bitte überprüfe die Details.',
            {
              'type': 'clubEvent',
              'clubId': clubRef.id,
              'id': eventRef.id,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        await db.collection('mail').add({
          to: userProfileRef.data().email,
          template: {
            name: 'ClubEventReminder',
            data: {
              clubName: clubRef.data().name,
              firstName: userProfileRef.data()?.firstName,
              lastName: userProfileRef.data()?.lastName,
              eventName: eventData.name,
              eventDescription: eventData.description,
              eventOrt: eventData.location,
              eventDatum: eventData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
              eventZeit: eventData.startDate.toDate().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}),
              abmeldefrist: eventData.registrationDeadline ? eventData.registrationDeadline.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'nicht festgelegt',
            },
          },
        });
      }
    }
  }
}

/* async function handleEventChanges(clubId: string, eventId: string, beforeData: EventData | undefined, afterData: EventData) {
  const attendeesRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').get();
  const clubRef = await db.collection('club').doc(clubId).get();
  const eventRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();

  for (const attendee of attendeesRef.docs) {
    if (attendee.data().status !== false) {
      const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
        await sendPushNotificationByUserProfileId(attendee.id,
            'Event ' + afterData.name + ' wurde aktualisiert',
            'Es gab Änderungen am Event. Bitte überprüfe die Details.',
            {
              'type': 'clubEvent',
              'clubId': clubRef.id,
              'id': eventRef.id,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        await db.collection('mail').add({
          to: userProfileRef.data().email,
          template: {
            name: 'ClubEventUpdated',
            data: {
              clubName: clubRef.data().name,
              eventName: afterData.name,
              firstName: userProfileRef.data()?.firstName,
              lastName: userProfileRef.data()?.lastName,
            },
          },
        });
      }
    }
  }
}

function hasEventDetailsChanged(beforeData: EventData | undefined, afterData: EventData | undefined): boolean {
  if (!beforeData || !afterData) return false;
  const relevantFields = ['name', 'description', 'startDate', 'endDate', 'location'];
  return relevantFields.some((field) => beforeData[field as keyof EventData] !== afterData[field as keyof EventData]);
}
*/
