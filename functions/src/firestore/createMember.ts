/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;

export async function createTeamMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createTeamMember");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  // check if user has admin claims..
  const adminUserRef = snapshot.data().userRef || false;
  if (adminUserRef) { // only provided in team Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[teamId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      const teamMembers = await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).set({
        "userProfile": userRef,
      });
    }
  }
}

export async function createClubMember(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createClubMember");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  // check if user has admin claims..
  const adminUserRef = snapshot.data().userRef || false;
  if (adminUserRef) { // only provided in club Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[clubId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      const clubMembers = await db.collection("club").doc(clubId).collection("members").doc(`${userId}`).set({
        "userProfile": userRef,
      });
    }
  }
}
