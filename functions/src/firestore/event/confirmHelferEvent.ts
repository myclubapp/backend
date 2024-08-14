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

export async function confirmHelferEvent(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("confirmHelferEvent /club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}");
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  const schichtId = context.params.schichtId;
  const userId = context.params.userId;

  if (change.after.data().confirmed === true && change.before.data().confirmed !== true) {
    console.log("confirmed");

    const userRef = await db.collection("userProfile").doc(userId).get();
    const clubRef = await db.collection("club").doc(clubId).get();
    const helferEventRef = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).get();
    const schichtRef = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).collection("schichten").doc(schichtId).get();

    const helferPunktRef = await db.collection("club").doc(clubId).collection("helferPunkte").add({
      ...change.after.data(),
      userId: userId,
      userRef: userRef.ref,
      clubId: clubRef.id,
      clubRef: clubRef.ref,
      name: helferEventRef.data().name,
      eventRef: helferEventRef.ref,
      eventName: helferEventRef.data().name,
      eventDate: helferEventRef.data().date,
      points: change.after.data().points || 1,

      schichtRef: schichtRef.ref,
      schichtName: schichtRef.data().name,
      schichtTimeFrom: schichtRef.data().timeFrom,
      schichtTimeTo: schichtRef.data().timeTo,
    });
    // Set Helferpunkt Ref to HelferEinsatz
    return db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).collection("schichten").doc(schichtId).collection("attendees").doc(userId).set({
      helferPunktRef: helferPunktRef.ref,
      helferPunktId: helferPunktRef.id,
    },
    {
      merge: true,
    });
  }
}
