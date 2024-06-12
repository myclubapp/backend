/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createTeamMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createTeamMember from Team Page via Admin");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  const teamRef = await db.collection("teams").doc(teamId).get();
  return db.collection("userProfile").doc(userId).collection("teams").doc(`${teamId}`).set({
    "teamRef": teamRef,
  });

  /* Security is covered by the DB rules. Only auth and admins can create team members and then triggers this method to add it to the userprofile as well.
  const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[teamId]) {
  // IS USER ALREADY PART OF ANY OTHER TEAM WITHIN THE CLUB OR CURRENT CLUB? MAYBE ONLY CLUB IS RELEVANT
  } else {
    // RESTORE DATA!
    await db.collection("userProfile").doc(userId).collection("teams").doc(teamId).set(
        snapshot.data()
    );
  }*/
}

// I GUESS WE DONT NEED THIS?
export async function createClubMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createClubMember from Club Page via Admin");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  return db.collection("userProfile").doc(userId).collection("clubs").doc(`${clubId}`).set({
    "clubRef": clubRef,
  });
  // const userId = context.params.userId;
  // const clubId = context.params.clubId;

  /* const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[clubId]) {
    const userRef = await db.collection("userProfile").doc(userId).get();
    await db.collection("club").doc(clubId).collection("members").doc(`${userId}`).set({
      "userProfileRef": userRef,
    });
  }*/
}
