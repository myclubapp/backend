
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
// import * as admin from 'firebase-admin';
import firebaseDAO from '../firebaseSingleton';
const db = firebaseDAO.instance.db;
import * as functions from 'firebase-functions/v1';
import {logger} from 'firebase-functions';
import {UserRecord} from 'firebase-functions/v1/auth';
const storage = firebaseDAO.instance.storage;
const admin = firebaseDAO.instance.auth;

// SEND BYE FirestoreEvent
export async function authUserDeleteUserSendByEmail(user: UserRecord, context: functions.EventContext) {
  return admin.firestore().collection('mail').add({
    to: user.email,
    template: {
      name: 'UserDeleteEmail',
      data: {
        // firstName: userProfile.data().firstName,
      },
    },
  });
}

export async function authUserDeleteUserAccount(user: UserRecord, context: functions.EventContext) {
  logger.info('delete user cleanup functions to delete user media, revoke refresh token for: ' + user.uid);

  // force logout in app
  await admin.auth().revokeRefreshTokens(user.uid).catch((error: any)=>{
    logger.info(`error revokeRefreshTokens -> most likely already done by deleting user, ${error}`);
  });

  // MEDIA
  // -> Profile picture
  await storage.bucket('myclubmanagement').file('userProfile/' + user.uid + '/profilePicture').delete().catch((error:any)=>{
    logger.info(`error deleting bucket for user -> most likely no user data stored, ${error}`);
  });

  // Send E-Mail that Account is deleted
  // wird via eigener Function gemacht..

  // DELETE USER DATA
  // const userId = context.params.userId;
  logger.info(`DELETE User ${user.uid} from DB (all Teams, Clubs, TeamAdmins, ClubAdmin)`);

  const teamList = await db.collection('userProfile').doc(user.uid).collection('teams').get();
  if (!teamList.empty) {
    logger.info('Delete Member in Teams ');
    for (const team of teamList.docs) {
      await db.collection('teams').doc(team.id).collection('members').doc(`${user.uid}`).delete();
      await db.collection('userProfile').doc(user.uid).collection('teams').doc(`${team.id}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete for Member in Teams ');
  }

  // delete admin from all TEAMS
  const teamAdminList = await db.collection('userProfile').doc(user.uid).collection('teamAdmin').get();
  if (!teamAdminList.empty) {
    logger.info('Delete Admin in Teams ');
    for (const team of teamAdminList.docs) {
      await db.collection('teams').doc(team.id).collection('admins').doc(`${user.uid}`).delete();
      await db.collection('userProfile').doc(user.uid).collection('teamAdmin').doc(`${team.id}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete for Admin in Teams ');
  }

  // delete user from all CLUBS
  const clubList = await db.collection('userProfile').doc(user.uid).collection('clubs').get();
  if (!clubList.empty) {
    logger.info('Delete Member in Clubs ');
    for (const club of clubList.docs) {
      await db.collection('club').doc(club.id).collection('members').doc(`${user.uid}`).delete();
      await db.collection('userProfile').doc(user.uid).collection('clubs').doc(`${club.id}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete for Member in Clubs ');
  }
  // delete admin from all club Admins
  const clubAdminList = await db.collection('userProfile').doc(user.uid).collection('clubAdmin').get();
  if (!clubAdminList.empty) {
    logger.info('Delete Admin in Clubs ');
    for (const club of clubAdminList.docs) {
      await db.collection('club').doc(club.id).collection('admins').doc(`${user.uid}`).delete();
      await db.collection('userProfile').doc(user.uid).collection('clubAdmin').doc(`${club.id}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    logger.info('Noting to delete for Admin in Clubs ');
  }

  const userCollectionsList = await db.collection('userProfile').doc(user.uid).listCollections();
  for (const collection of userCollectionsList) {
    logger.info('Auto delete collection with id: ' + collection.id);
    const collectionData = await db.collection('userProfile').doc(user.uid).collection(collection.id).get();
    for (const document of collectionData.docs) {
      await db.collection('userProfile').doc(user.uid).collection(collection.id).doc(document.id).delete();
    }
  }

  // Events?
  /*
  // Trainings?
  const querySnapshotTrainings = await db.collectionGroup("attendees", userId).get();
  querySnapshotTrainings.forEach(async (doc:QueryDocumentSnapshot ) => {
    const gameId: string = doc.ref.parent.parent?.id || "";
    const teamId: string = doc.ref.parent.parent?.parent?.id || "";
    await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").delete();
  });

  // GAMES / Trainings / Events
  logger.info("delete attendee data");
  const querySnapshot = await db.collectionGroup("attendees").where("id", "==", userId).get();
  for (const doc of querySnapshot.docs) {
    logger.info(`Document Ref: ${doc.ref.path}`);

    if (doc.ref.parent.parent?.parent?.id === "games") {
      const gameId: string = doc.ref.parent.parent?.id || "";
      const teamId: string = doc.ref.parent.parent?.parent?.parent?.id || "";

      logger.info(`GameId: ${gameId}`);
      logger.info(`Team Id: ${teamId}`);
      await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").doc(userId).delete();
    }
  }

  // offene Requests?
  --> clubRequests
  --> teamRequests
*/

  // Delete User Data
  await db.collection('userProfile').doc(user.uid).delete();

  // Delete account in firebase --> Should be done already
  return admin.auth().deleteUser(user.uid).catch((error: any)=> {
    logger.info(`error deleting user -> most likely already done, ${error}`);
  });
}
