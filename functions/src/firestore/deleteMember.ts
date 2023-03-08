/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

// const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;

export async function deleteMemberFromTeam(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Delete Member From Club");
  // const userId = context.params.userId;
  // const teamId = context.params.teamId;
  // TODO -> Remove from Team /teams/XX/members
  // TODO -> Remove from Team Admin /teams/XXX/admins

  // TODO -> remove from userProfile of user as well...
}

export async function deleteTeamMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Self remove via User Profile");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  // delete team admin List from team and user
  // const userTeamMember = await db.collection("userProfile").doc(userId).collection("teams").doc(teamId).delete();
  // const teamMemberUser = await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).delete();

  // CODE FROM deleteAdmin.ts
  // delete team admin List from team and user
  // const userTeamAdmin = await db.collection("userProfile").doc(userId).collection("teamAdmin").doc(teamId).delete();
  // const teamAdminUser = await db.collection("teams").doc(teamId).collection("admin").doc(`${userId}`).delete();

  console.log(`Admin with id ${userId} leaves TeamAdminList ${teamId}`);
  const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[teamId]) {
    console.log("remove admin for Team");
    const customClaims = user.customClaims;
    delete customClaims[teamId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true;
}

export async function deleteMemberFromClub(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Delete Member From Club");
  // const userId = context.params.userId;
  // const clubId = context.params.clubId;
  // TODO -> Remove from all Teams /teams/XX/members
  // TODO -> Remove from all Teams Admin /teams/XXX/admins
  // TODO -> Remove from all Clubs -> already done
  // TODO -> Remove from all Clubs Admin /club/clubid/admins

  // TODO -> remove from userProfile of user as well...
}

export async function deleteClubMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Self remove from Club via Profile");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  // delete club admin List from club and user
  // const userClubMember = await db.collection("userProfile").doc(userId).collection("clubs").doc(clubId).delete();
  // const clubMemberUser = await db.collection("club").doc(clubId).collection("members").doc(`${userId}`).delete();

  // CODE FROM deleteAdmin.ts
  // delete club admin List from club and user
  // const userClubAdmin = await db.collection("userProfile").doc(userId).collection("clubAdmin").doc(clubId).delete();
  // const clubAdminUser = await db.collection("club").doc(clubId).collection("admins").doc(`${userId}`).delete();

  console.log(`Admin with id ${userId} leaves ClubAdminList ${clubId}`);
  const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[clubId]) {
    console.log("remove admin for Club");
    const customClaims = user.customClaims;
    delete customClaims[clubId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true;
}
