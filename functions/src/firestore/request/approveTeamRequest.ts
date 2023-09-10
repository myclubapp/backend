/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {Change} from "firebase-functions";

const db = firebaseDAO.instance.db;

export async function approveTeamRequest(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("approveTeamRequest");

  const requestId = context.params.requestId;
  const teamId = context.params.teamId;
  const requestRef = await db.collection("teamId").doc(teamId).collection("requests").doc(requestId).get();

  const userProfileRef = await db.collection("userProfile").doc(requestId).get();
  const teamRef = await db.collection("teams").doc(teamId).get();

  if (change.after.data().approve === true) {
    console.log(`approve request ${requestRef.id}`);

    await db.collection("teams").doc(teamId).collection("members").doc(userProfileRef.id).set({
      "userProfileRef": userProfileRef.ref,
    });
    await db.collection("userProfile").doc(userProfileRef.id).collection("teams").doc(teamId).set({
      "teamRef": teamRef.ref,
    });

    await db.collection("teams").doc(teamId).collection("requests").doc(userProfileRef.id).delete();
    await db.collection("userProfile").doc(userProfileRef.id).collection("teamRequests").doc(teamId).delete();
  } else if (change.after.data().approve === false) {
    console.log(`TEAM request NOT APPROVED ${requestRef.id}`);
    await db.collection("teams").doc(teamId).collection("requests").doc(userProfileRef.id).delete();
    await db.collection("userProfile").doc(userProfileRef.id).collection("teamRequests").doc(teamId).delete();
  }

  // SEND EMAIL

  return true;
}
