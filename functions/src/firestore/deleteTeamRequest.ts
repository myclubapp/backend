/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeamRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteTeamRequest");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  await db.collection("teams").doc(teamId).collection("requests").doc(userId).delete();
}
