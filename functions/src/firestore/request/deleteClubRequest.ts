
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteClubRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteClubRequest');
  const {userId, clubId} = event.params;

  if (!event.data) {
    logger.info('No data associated with the Club Request');
    return;
  }

  return db.collection('club').doc(clubId).collection('requests').doc(userId).delete();
}
