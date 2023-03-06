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

export async function deleteClubRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteClubRequest");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  await db.collection("club").doc(clubId).collection("requests").doc(userId).delete();
}
