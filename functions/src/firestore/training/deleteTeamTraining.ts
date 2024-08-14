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

export async function deleteTeamTraining(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteTeamTraining");
  const teamId = context.params.teamId;
  const trainingId = context.params.clubId;

  // Delete all attendees to avoid "empty" training docs
  const attendeesRef = await db.collection("teams").doc(teamId).collection("trainings").doc(trainingId).collection("attendees").get();
  for (const attendee of attendeesRef.docs) {
    await db.collection("teams").doc(teamId).collection("trainings").doc(trainingId).collection("attendees").doc(attendee.id).delete();
  }

  return db.collection("teams").doc(teamId).collection("trainings").doc(trainingId).delete();
}
