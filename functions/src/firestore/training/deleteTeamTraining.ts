
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamTraining(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('deleteTeamTraining');
  const teamId = event.params.teamId;
  const trainingId = event.params.trainingId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').get();
  for (const attendee of attendeesRef.docs) {
    await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').doc(attendee.id).delete();
  }

  // Delete all exercises to avoid "empty" training docs
  const exercisesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('exercises').get();
  for (const exercise of exercisesRef.docs) {
    await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('exercise').doc(exercise.id).delete();
  }


  return db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).delete();
}
