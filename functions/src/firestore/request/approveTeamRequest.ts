
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function approveTeamRequest(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('approveTeamRequest');

  // Sicherstellen dass event.data und after existieren
  if (!event.data?.after) {
    logger.info('No data associated with the event');
    return;
  }

  const afterData = event.data.after.data();
  if (!afterData) {
    logger.info('No after data available');
    return;
  }

  const {requestId, teamId} = event.params;

  const requestRef = await db.collection('teamId').doc(teamId).collection('requests').doc(requestId).get();
  const userProfileRef = await db.collection('userProfile').doc(requestId).get();
  const teamRef = await db.collection('teams').doc(teamId).get();

  if ('approve' in afterData && afterData.approve === true) {
    logger.info(`approve request ${requestRef.id}`);

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
    logger.info(`TEAM request NOT APPROVED ${requestRef.id}`);
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
