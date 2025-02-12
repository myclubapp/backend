
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamGame(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteTeamGame');
  const {teamId, gameId} = event.params;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection('teams').doc(teamId).collection('games').doc(gameId).collection('attendees').get();
  for (const attendee of attendeesRef.docs) {
    await db.collection('teams').doc(teamId).collection('games').doc(gameId).collection('attendees').doc(attendee.id).delete();
  }

  const teamRef = await db.collection('teams').doc(teamId).get();

  // delete club game as well?
  await db.collection('club').doc(teamRef.data().clubId).collection('games').doc(gameId).delete();

  // delete aufgebot..


  return db.collection('teams').doc(teamId).collection('games').doc(gameId).delete();
}
