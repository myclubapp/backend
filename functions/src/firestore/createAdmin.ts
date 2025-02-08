/* eslint-disable max-len */

import firebaseDAO from './../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
const db = firebaseDAO.instance.db;

export async function createTeamAdmin(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('createTeamAdmin');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  const teamRef = await db.collection('teams').doc(teamId).get();
  return db.collection('userProfile').doc(userId).collection('teamAdmin').doc(`${teamId}`).set({
    'teamRef': teamRef.ref,
  });
}

export async function createClubAdmin(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('createClubAdmin');
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  const clubRef = await db.collection('club').doc(clubId).get();
  return db.collection('userProfile').doc(userId).collection('clubAdmin').doc(`${clubId}`).set({
    'clubRef': clubRef.ref,
  });
}
