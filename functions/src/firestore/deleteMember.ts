/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteTeamMember > Team Page via Administrator");
  const userId = context.params.userId;
  const teamId = context.params.teamId;
  console.log("Auth User > " + context.auth);
  console.log("Delete user from team " + userId, teamId);

  return db.collection("userProfile").doc().collection("teams").doc(teamId).delete();
  /*
  const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[teamId]) {
    // REMOVE from Team Admin? (incl. claims)

    // SEND EMAIL? --> Your are still part of the organization and need to cancel subscription

    // FINALLY REMOVE FROM CLUB
    return db.collection("userProfile").doc().collection("teams").doc(teamId).delete();
  } else {
    // RESTORE DATA!
    console.log("Restore DATA");
    return await db.collection("teams").doc(teamId).collection("members").doc(userId).set(
        snapshot.data()
    );
  }*/
}
export async function deleteClubMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteClubMember > Club Page via Administrator");
  const userId = context.params.userId;
  const clubId = context.params.clubId;
  console.log("Auth User > " + context.auth);
  console.log("Delete user from club " + userId, clubId);

  // TODO: DELETE FROM ALL TEAMS AS WELL!

  return db.collection("userProfile").doc(userId).collection("club").doc(clubId).delete();
  /*
  const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[clubId]) {
    // Remove from all Teams
    // TODO

    // REMOVE from Team Admin? (incl. claims)

    // REMOVE from Club Admin (incl. claims)

    // SEND EMAIL? --> Your are still part of the organization and need to cancel subscription

    // FINALLY REMOVE FROM CLUB
    return db.collection("userProfile").doc(userId).collection("club").doc(clubId).delete();
  } else {
    // RESTORE DATA!
    console.log("Restore DATA");
    return await db.collection("club").doc(clubId).collection("members").doc(userId).set(
        snapshot.data()
    );
  }*/
}
/* export async function deleteMemberFromClub(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Delete Member From Club");
  // const userId = context.params.userId;
  // const clubId = context.params.clubId;


  // delete team admin List from team and user
  // const userTeamMember = await db.collection("userProfile").doc(userId).collection("teams").doc(teamId).delete();
  // const teamMemberUser = await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).delete();

  // CODE FROM deleteAdmin.ts
  // delete team admin List from team and user
  // const userTeamAdmin = await db.collection("userProfile").doc(userId).collection("teamAdmin").doc(teamId).delete();
  // const teamAdminUser = await db.collection("teams").doc(teamId).collection("admin").doc(`${userId}`).delete();

  // TODO -> Remove from all Teams /teams/XX/members
  // TODO -> Remove from all Teams Admin /teams/XXX/admins
  // TODO -> Remove from all Clubs -> already done
  // TODO -> Remove from all Clubs Admin /club/clubid/admins

  // TODO -> remove from userProfile of user as well...
} */
// delete club admin List from club and user
// const userClubMember = await db.collection("userProfile").doc(userId).collection("clubs").doc(clubId).delete();
// const clubMemberUser = await db.collection("club").doc(clubId).collection("members").doc(`${userId}`).delete();

// CODE FROM deleteAdmin.ts
// delete club admin List from club and user
// const userClubAdmin = await db.collection("userProfile").doc(userId).collection("clubAdmin").doc(clubId).delete();
// const clubAdminUser = await db.collection("club").doc(clubId).collection("admins").doc(`${userId}`).delete();
/*
  console.log(`Admin with id ${userId} leaves ClubAdminList ${clubId}`);
  const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[clubId]) {
    console.log("remove admin for Club");
    const customClaims = user.customClaims;
    delete customClaims[clubId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true;
  */

