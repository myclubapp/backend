/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteHelferPunkt(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteClubEvent");

  const clubId = context.params.clubId;
  const helferPunktId = context.params.helferPunktId;

  const helferPunktData = snapshot.data();

  const helferEvent = await db.collection("club").doc(clubId).collection("helferEvents").doc(helferPunktData.eventRef.id).collection("schichten").doc(helferPunktData.schichtRef.id).collection("attendees").doc(helferPunktData.userId).get();
  if (helferEvent.data().helferPunktId === helferPunktId) {
    console.log("delete Helerpunkt");

    return db.collection("club").doc(clubId).collection("helferEvents").doc(helferPunktData.eventRef.id).collection("schichten").doc(helferPunktData.schichtRef.id).collection("attendees").doc(helferPunktData.userId).set({
      "status": helferEvent.data().status,
    });
  } else {
    return true;
  }
}
