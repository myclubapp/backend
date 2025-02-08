
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;

export async function approveTeamRequest(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  console.log('approveTeamRequest');

  // Sicherstellen dass event.data und after existieren
  if (!event.data?.after) {
    console.log('No data associated with the event');
    return;
  }

  const afterData = event.data.after.data();
  if (!afterData) {
    console.log('No after data available');
    return;
  }

  const requestId = event.params.requestId;
  const teamId = event.params.teamId;

  const requestRef = await db.collection('teamId').doc(teamId).collection('requests').doc(requestId).get();
  const userProfileRef = await db.collection('userProfile').doc(requestId).get();
  const teamRef = await db.collection('teams').doc(teamId).get();

  if ('approve' in afterData && afterData.approve === true) {
    console.log(`approve request ${requestRef.id}`);

    await db.collection('teams').doc(teamId).collection('members').doc(userProfileRef.id).set({
      'userProfileRef': userProfileRef.ref,
    });
    await db.collection('userProfile').doc(userProfileRef.id).collection('teams').doc(teamId).set({
      'teamRef': teamRef.ref,
    });

    // clean up requests
    await db.collection('teams').doc(teamId).collection('requests').doc(userProfileRef.id).delete();
    await db.collection('userProfile').doc(userProfileRef.id).collection('teamRequests').doc(teamId).delete();

    // send out mail to user
    return db.collection('mail').add({
      to: userProfileRef.data().email,
      template: {
        name: 'TeamRequestApproved',
        data: {
          teamName: teamRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  } else if ('approve' in afterData && afterData.approve === false) {
    console.log(`TEAM request NOT APPROVED ${requestRef.id}`);
    // clean up requests
    await db.collection('teams').doc(teamId).collection('requests').doc(userProfileRef.id).delete();
    await db.collection('userProfile').doc(userProfileRef.id).collection('teamRequests').doc(teamId).delete();
    // send out mail to user
    return db.collection('mail').add({
      to: userProfileRef.data().email,
      template: {
        name: 'TeamRequestRejected',
        data: {
          teamName: teamRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  }

  // SEND EMAIL

  return true;
}
