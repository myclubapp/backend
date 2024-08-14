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

export async function deleteTeamGame(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteTeamGame");
  const teamId = context.params.teamId;
  const gameId = context.params.gameId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").get();
  for (const attendee of attendeesRef.docs) {
    await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").doc(attendee.id).delete();
  }

  const teamRef = await db.collection("teams").doc(teamId).get();

  // delete club game as well?
  await db.collection("club").doc(teamRef.data().clubId).collection("games").doc(gameId).delete();

  // delete aufgebot..


  return db.collection("teams").doc(teamId).collection("games").doc(gameId).delete();
}
