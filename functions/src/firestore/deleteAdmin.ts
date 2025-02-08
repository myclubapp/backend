/* eslint-disable max-len */

import firebaseDAO from './../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const deleteTeamAdmin = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  console.log('deleteTeamAdmin');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  console.log(`Admin with id ${userId} leaves TeamAdminList ${teamId}`);
  return db.collection('userProfile').doc(userId).collection('teamAdmin').doc(teamId).delete();

  // delete team admin List from team and user
  // const userTeamAdmin = await db.collection("userProfile").doc(userId).collection("teamAdmin").doc(teamId).delete();
  // const teamAdminUser = await db.collection("teams").doc(teamId).collection("admin").doc(`${userId}`).delete();
  /*
  console.log(`Admin with id ${userId} leaves TeamAdminList ${teamId}`);
  const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[teamId]) {
    console.log("remove admin for Team");
    const customClaims = user.customClaims;
    delete customClaims[teamId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true;*/
};

export const deleteClubAdmin = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  console.log('deleteClubAdmin');
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  // delete club admin List from club and user
  // const userClubAdmin = await db.collection("userProfile").doc(userId).collection("clubAdmin").doc(clubId).delete();
  // const clubAdminUser = await db.collection("club").doc(clubId).collection("admins").doc(`${userId}`).delete();

  console.log(`Admin with id ${userId} leaves ClubAdminList ${clubId}`);
  return db.collection('userProfile').doc(userId).collection('clubAdmin').doc(clubId).delete();
  /* const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[clubId]) {
    console.log("remove admin for Club");
    const customClaims = user.customClaims;
    delete customClaims[clubId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true; */
};
