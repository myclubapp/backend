/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;

// const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createTeamAdmin(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createTeamAdmin");

  const userId = context.params.userId;
  const teamId = context.params.teamId;

  const teamRef = await db.collection("teams").doc(teamId).get();
  return db.collection("userProfile").doc(userId).collection("teamAdmin").doc(`${teamId}`).set({
    "teamRef": teamRef,
  });
}

export async function createClubAdmin(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createClubAdmin");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  return db.collection("userProfile").doc(userId).collection("clubAdmin").doc(`${clubId}`).set({
    "clubRef": clubRef,
  });
}
