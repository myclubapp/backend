
/* eslint-disable max-len */
import firebaseDAO from './../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const leaveTeamAsMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('leaveTeamAsMember');
  const {userId, teamId} = event.params;

  return db.collection('teams').doc(teamId).collection('members').doc(userId).delete();
};

export const leaveClubAsMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('leaveClubAsMember');
  const {userId, clubId} = event.params;

  return db.collection('club').doc(clubId).collection('members').doc(userId).delete();
};
