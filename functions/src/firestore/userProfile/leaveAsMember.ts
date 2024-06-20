/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function leaveTeamAsMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("leaveTeamAsMember");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  return db.collection("teams").doc(teamId).collection("members").doc(userId).delete();
}

export async function leaveClubAsMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("leaveTeamAsMember");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  return db.collection("club").doc(clubId).collection("members").doc(userId).delete();
}
