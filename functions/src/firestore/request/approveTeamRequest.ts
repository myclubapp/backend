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
// const auth = firebaseDAO.instance.auth;

export async function approveTeamRequest(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("approveTeamRequest");

  const requestId = context.params.requestId;
  const teamId = context.params.teamId;
  const requestRef = await db.collection("teamId").doc(teamId).collection("requests").doc(requestId).get();

  const userProfileRef = await db.collection("userProfile").doc(requestId).get();
  const teamRef = await db.collection("teams").doc(teamId).get();

  if (change.after.data().approve) {
    console.log(`approve request ${requestRef.id}`);

    await db.collection("teams").doc(teamId).collection("members").doc(userProfileRef.id).set({
      "userProfileRef": userProfileRef.ref,
    });
    await db.collection("userProfile").doc(userProfileRef.id).collection("teams").doc(teamId).set({
      "teamRef": teamRef.ref,
    });

    await db.collection("teams").doc(teamId).collection("requests").doc(userProfileRef.id).delete();
    await db.collection("userProfile").doc(userProfileRef.id).collection("teamRequests").doc(teamId).delete();
  }

  return true;
  // TODO Send Email to User added.

  /*
  // const clubRef = await db.collection("club").doc(clubId).get();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });
  // SEND REQUEST CONFIRMATION E-MAIL TO USER
  await db.collection("mail").add({
    to: userProfileRef.data()?.email,
    template: {
      name: "ClubRequestAdminEmail",
      data: {
        clubName: clubRef.data().name,
        firstName: userProfileRef.data()?.firstName,
      },
    },
  });

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  const clubAdminRef = await db.collection("club").doc(clubId).collection("admins").get();
  for (const admin of clubAdminRef.docs) {
    const userProfileAdminRef = await db.collection("userProfile").doc(admin.id).get();
    if (userProfileAdminRef.exists) {
      receipient.push(userProfileAdminRef.data().email);
    }
  }

  return db.collection("mail").add({
    to: receipient,
    template: {
      name: "ClubRequestAdminEmail",
      data: {
        clubName: clubRef.data().name,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
        email: userProfileRef.data()?.email,
      },
    },
  });
  */
}