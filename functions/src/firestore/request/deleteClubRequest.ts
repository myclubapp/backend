
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteClubRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('deleteClubRequest');
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  if (!event.data) {
    console.log('No data associated with the Club Request');
    return;
  }

  return db.collection('club').doc(clubId).collection('requests').doc(userId).delete();
}
