/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createTeamRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("Create Team Request");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  const teamRef = await db.collection("teams").doc(teamId).get();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  await db.collection("teams").doc(teamId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  // SEND REQUEST CONFIRMATION E-MAIL TO USER
  await db.collection("mail").add({
    to: userProfileRef.data()?.email,
    template: {
      name: "TeamRequestEmail",
      data: {
        teamName: teamRef.data().liga + " " + teamRef.data().name,
        firstName: userProfileRef.data()?.firstName,
      },
    },
  });

    // SEND REQUEST E-MAIL TO CLUB ADMIN
    let receipient = [];
    const clubAdminRef: QueryDocumentSnapshot = await db.collection("club").doc(teamRef.data().clubRef.id).collection("admins").get();
    for (let admin of clubAdminRef.docs) {
      const userProfileRef: QueryDocumentSnapshot = await db.collection("userProfile").doc(admin.id).get();
      receipient.push(userProfileRef.data().email);
    }

    // SEND REQUEST E-MAIL TO TEAM ADMIN
    const teamAdminRef: QueryDocumentSnapshot = await db.collection("teams").doc(teamId).collection("admins").get();
    for (let admin of teamAdminRef.docs) {
      const userProfileRef: QueryDocumentSnapshot = await db.collection("userProfile").doc(admin.id).get();
      receipient.push(userProfileRef.data().email);
    }

    return db.collection("mail").add({
      to: receipient,
      template: {
        name: "TeamRequestAdminEmail",
        data: {
          teamName: teamRef.data().liga + " " + teamRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
          email: userProfileRef.data()?.email,
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
