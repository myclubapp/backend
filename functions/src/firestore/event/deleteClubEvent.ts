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

export async function deleteClubEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteClubEvent");

  const clubId = context.params.clubId;
  const eventId = context.params.eventId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection("club").doc(clubId).collection("events").doc(eventId).collection("attendees").get();
  for (const attendee of attendeesRef.docs) {
    await db.collection("club").doc(clubId).collection("events").doc(eventId).collection("attendees").doc(attendee.id).delete();
  }

  return db.collection("club").doc(clubId).collection("events").doc(eventId).delete();
}
