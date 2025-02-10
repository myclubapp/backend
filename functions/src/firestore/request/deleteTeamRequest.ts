
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteTeamRequest');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  if (!event.data) {
    logger.info('No data associated with the Team Request');
    return;
  }

  return db.collection('teams').doc(teamId).collection('requests').doc(userId).delete();
}
