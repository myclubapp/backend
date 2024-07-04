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

export async function createCheckoutSession(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Create New Checkout Session");

  const clubId = context.params.clubId;
  const sessionId = context.params.sessionId;

  console.log("clubId: " + clubId);
  console.log("sessionId: " + sessionId);

  const sessionData = snapshot.data();
  const clubRef = await db.collection("club").doc(clubId).get();

  return db.collection("userProfile").doc(sessionData.userId).collection("checkout_sessions").doc(sessionId).set({
    ...sessionData,
    updated: new Date(),
    clubId: clubId,
    clubRef: clubRef.ref,
  });
}

export async function updateCheckoutSession(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("change Checkout Session");
  const sessionId = context.params.sessionId;
  const userId = context.params.userId;

  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  return db.collection("userProfile").doc(userId).collection("checkout_sessions").doc(sessionId).set({
    ...change.after.data(),
    userProfileRef: userProfileRef.ref,
  },
  {merge: true}
  );
}
