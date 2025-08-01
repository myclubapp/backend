
/* eslint-disable max-len */

// import firebaseDAO from '../../firebaseSingleton.js';
// import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
// import {sendEmailByUserId} from '../../utils/email.js';
// const db = firebaseDAO.instance.db;

export async function changeClub(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeClub');
  const {clubId} = event.params;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (beforeData?.active === false && afterData?.active === true) {
    console.log('Club activated', clubId);

    // SEND E-Mail To info@my-club.ch


    // Send E-Mail to all admins
  }

  /* const userProfileRef = await db.collection('userProfile').doc(member.id).get();
  if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
    await sendPushNotificationByUserProfileId(member.id,
        'Die Veranstaltung ' + eventData.name + ' vom ' + eventData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' wurde abgesagt.',
        'Begründung: ' + eventData.cancelledReason,
        {
          'type': 'clubEvent',
          'clubId': clubRef.id,
          'id': eventId,
        });
  }
  if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
    await sendEmailByUserId(userProfileRef.id, 'ClubEventCancelled', {
      clubName: clubRef.data().name,
      firstName: userProfileRef.data()?.firstName,
      lastName: userProfileRef.data()?.lastName,
      eventName: eventData.name,
      eventDescription: eventData.description,
      eventOrt: eventData.location,
      eventDatum: eventData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
      absageGrund: eventData.cancelledReason,
    });
  }*/
}
