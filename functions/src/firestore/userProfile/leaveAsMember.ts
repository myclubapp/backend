/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../../firebaseSingleton";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const leaveTeamAsMember = async (event: functions.firestore.FirestoreEvent<functions.firestore.QueryDocumentSnapshot | undefined>) => {
  console.log("leaveTeamAsMember");
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  return db.collection("teams").doc(teamId).collection("members").doc(userId).delete();
};

export const leaveClubAsMember = async (event: functions.firestore.FirestoreEvent<functions.firestore.QueryDocumentSnapshot | undefined>) => {
  console.log("leaveTeamAsMember");
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  return db.collection("club").doc(clubId).collection("members").doc(userId).delete();
};
