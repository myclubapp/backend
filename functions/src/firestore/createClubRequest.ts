/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createClubRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createTeamMember");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  // SEND REQUEST E-MAIL TO USER
  return db.collection("mail").add({
    to: userProfileRef.data()?.email,
    template: {
      name: "ClubRequestEmail",
      data: {
        clubName: clubRef.data().name,
        firstName: userProfileRef.data()?.firstName,
      },
    },
  });

  // check if user has admin claims..
  /*
  const adminUserRef = snapshot.data().userProfileRef || false;
  if (adminUserRef) { // only provided in team Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[teamId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).set({
        "userProfileRef": userRef,
      });
    }
  } */
}