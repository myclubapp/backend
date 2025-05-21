/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function changeClubEventCancelled(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeClubEventCancelled');
  const {clubId, eventId} = event.params;

  if (event.data?.after.data()?.cancelled === true &&
    (event.data?.before.data()?.cancelled === false || event.data?.before.data()?.cancelled === undefined)) {
    logger.info('Event cancelled');

    const attendeesRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).collection('attendees').get();

    const clubRef = await db.collection('club').doc(clubId).get();
    const eventRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();
    const eventData = eventRef.data();

    for (const attendee of attendeesRef.docs) {
      if (attendee.data().status !== false) {
        const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
        if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
          await sendPushNotificationByUserProfileId(attendee.id,
              'Event ' + eventData?.name + ' vom ' + eventData?.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' wurde abgesagt.',
              'Begründung: ' + eventData?.cancelledReason,
              {
                'type': 'event',
                'clubId': clubRef.id,
                'id': eventData?.id,
              });
        }
      }
    }
    return true;
  } else {
    logger.info('Event not cancelled - maybe other change triggered this function');
    return true;
  }
}
