/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {sendPushNotificationByUserProfileId} from '../../utils/push';

const db = firebaseDAO.instance.db;

export async function addClubTeam(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const clubId = event.params.clubId;
  const teamId = event.params.teamId;

  // CHECK IF TEAM was added via JOB?
  const teamRef = await db.collection('teams').doc(teamId).get();
  if (teamRef.exists) {
    console.log(' > Do not Update');
    return true;
  }
  console.log('Add New Team to Club via Manual Action NOT via JOB');
  console.log('clubId: ' + clubId);
  console.log('teamId: ' + teamId);

  const teamData = event.data?.data();
  const clubRef = await db.collection('club').doc(clubId).get();

  await db.collection('teams').doc(teamId).set({
    ...teamData,
    externalId: 'manual',
    logo: clubRef.data().logo || '-',
    type: 'Club',
    updated: new Date(),
    clubId: clubId,
    clubRef: clubRef.ref,
  });
  // const teamRef = await db.collection("teams").doc(teamId).get();

  return db.collection('club').doc(clubId).collection('teams').doc(teamId).set({
    teamRef: teamRef.ref,
  });
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
      await sendPushNotificationByUserProfileId(
          clubMember.id,
          'Neue Veranstaltung verfügbar: ',
          clubEventRef.data()?.name + ' - ' + clubEventRef.data()?.description,
          {
            'type': 'clubEvent',
            'clubId': clubId,
            'id': clubEventRef.id,
          });
    }
  }
}
