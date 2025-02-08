
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton';
import {sendPushNotificationByUserProfileId} from '../../utils/push';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
const db = firebaseDAO.instance.db;

export async function createClubEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('CREATE ClubEvent');

  const userId = event.params.userId;
  const eventId = event.params.eventId;

  console.log('userId: ' + userId);
  console.log('EventId: ' + eventId);

  const eventData = event.data?.data();
  const clubRef = await db.collection('club').doc(eventData?.clubId).get();
  console.log(clubRef.id);

  const newClubEventRef = await db.collection('club').doc(clubRef.id).collection('events').add({
    ...eventData,
  });

  console.log('New Club Event created: ' + newClubEventRef.id);
  return db.collection('userProfile').doc(userId).collection('clubEvents').doc(eventId).delete();
}

export async function createNotificationClubEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const clubId = event.params.clubId;
  const eventId = event.params.eventId;
  console.log(clubId, eventId);

  const clubEventRef = await db.collection('club').doc(clubId).collection('events').doc(eventId).get();
  const clubMembersRef = await db.collection('club').doc(clubId).collection('members').get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection('userProfile').doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
        await sendPushNotificationByUserProfileId(
            clubMember.id,
            'Neue Veranstaltung verfügbar: ',
            clubEventRef.data()?.name + ' - ' + clubEventRef.data()?.description,
            {
              'type': 'clubEvent',
              'clubId': clubId,
              'id': clubEventRef.id,
            },
        );
      }
    }
  }
}
