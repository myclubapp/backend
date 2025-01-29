/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */

import firebaseDAO from "./../firebaseSingleton";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
const db = firebaseDAO.instance.db;

// const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createTeamAdmin(event: DocumentSnapshot) {
  console.log("createTeamAdmin");
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  const teamRef = await db.collection("teams").doc(teamId).get();
  return db.collection("userProfile").doc(userId).collection("teamAdmin").doc(`${teamId}`).set({
    "teamRef": teamRef.ref,
  });
}

export async function createClubAdmin(event: DocumentSnapshot) {
  console.log("createClubAdmin");
  const userId = event.params.userId;
  const clubId = event.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  return db.collection("userProfile").doc(userId).collection("clubAdmin").doc(`${clubId}`).set({
    "clubRef": clubRef.ref,
  });
}
