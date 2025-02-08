
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('deleteTeamRequest');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  if (!event.data) {
    console.log('No data associated with the Team Request');
    return;
  }

  return db.collection('teams').doc(teamId).collection('requests').doc(userId).delete();
}
