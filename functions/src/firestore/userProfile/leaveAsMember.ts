
/* eslint-disable max-len */
import firebaseDAO from './../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const leaveTeamAsMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  console.log('leaveTeamAsMember');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  return db.collection('teams').doc(teamId).collection('members').doc(userId).delete();
};

export const leaveClubAsMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  console.log('leaveClubAsMember');
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  return db.collection('club').doc(clubId).collection('members').doc(userId).delete();
};
