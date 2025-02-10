/* eslint-disable max-len */
import firebaseDAO from './../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const deleteTeam = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('deleteTeamData');
  const teamId = event.params.teamId;

  // ADMINS
  const adminList = await db.collection('teams').doc(teamId).collection('admins').get();
  if (!adminList.empty) {
    logger.info('Delete Admin from Team ');
    for (const admin of adminList.docs) {
      await db.collection('teams').doc(teamId).collection('admins').doc(`${admin.id}`).delete();
      await db.collection('userProfile').doc(admin.uid).collection('teamAdmin').doc(`${teamId}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete');
  }
  // MEMBERS
  const memberList = await db.collection('teams').doc(teamId).collection('members').get();
  if (!memberList.empty) {
    logger.info('Delete Member from Team ');
    for (const member of memberList.docs) {
      await db.collection('teams').doc(teamId).collection('members').doc(`${member.id}`).delete();
      await db.collection('userProfile').doc(member.uid).collection('teams').doc(`${teamId}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete');
  }
  // TRAININGS
  const trainingList = await db.collection('teams').doc(teamId).collection('trainings').get();
  if (!trainingList.empty) {
    logger.info('Delete Training from Team ');
    for (const training of trainingList.docs) {
      // Attendee List
      const trainingAttendeeList = await db.collection('teams').doc(teamId).collection('trainings').doc(training.id).collection('attendees').get();
      if (!trainingAttendeeList.empty) {
        logger.info('Delete attendee from training ');
        for (const attendee of trainingAttendeeList.docs) {
          await db.collection('teams').doc(teamId).collection('trainings').doc(training.id).collection('attendees').doc(attendee.id).delete();
        }
      } else {
        logger.info('Noting to delete');
      }
      // Delete Training after attendees are deleted
      await db.collection('teams').doc(teamId).collection('trainings').doc(`${training.id}`).delete();
    }
  } else {
    logger.info('Noting to delete');
  }


  // GAMES
  const gameList = await db.collection('teams').doc(teamId).collection('games').get();
  if (!gameList.empty) {
    logger.info('Delete Games from Team ');
    for (const game of gameList.docs) {
      // Attendee List
      const gameAttendeeList = await db.collection('teams')
          .doc(teamId)
          .collection('games')
          .doc(game.id)
          .collection('attendees')
          .get();

      if (!gameAttendeeList.empty) {
        logger.info('Delete attendee from game ');
        for (const attendee of gameAttendeeList.docs) {
          await db.collection('teams')
              .doc(teamId)
              .collection('games')
              .doc(game.id)
              .collection('attendees')
              .doc(attendee.id)
              .delete();
        }
      } else {
        logger.info('Nothing to delete');
      }

      // Delete Game after attendees are deleted
      await db.collection('teams')
          .doc(teamId)
          .collection('games')
          .doc(`${game.id}`)
          .delete();
    }
  } else {
    logger.info('Nothing to delete');
  }

  return db.collection('teams').doc(teamId).delete();
};
