/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "@google-cloud/firestore";

const db = firebaseDAO.instance.db;

/* export function authUserCreate(user: admin.auth.UserRecord, context: functions.EventContext) {
  db.collection("userProfile").doc(`${user.uid}`).set({
    "email": user.email,
    "id": user.uid,
  }, {
    merge: true,
  }).then((ok: any) => {
    return "ok";
  }).catch((e: any) => {
    return "error";
  });
} */

export async function authUserCreateSendWelcomeEmail(user: admin.auth.UserRecord, context: functions.EventContext) {
  console.log(">>> NEW USER with ID: " + user.uid );
  const link = await admin.auth().generateEmailVerificationLink(user.email as string);
  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    console.log("no user data found");
  }
  // console.log(userProfile.data());
  return db.collection("mail").add({
    to: user.email,
    template: {
      name: "UserCreateWelcomeMail",
      data: {
        link: link,
        firstName: userProfile.data().firstName,
      },
    },
  });
}

export async function authUserCreateAdminUser(user: admin.auth.UserRecord, context: functions.EventContext) {
  console.log(">>> NEW USER with ID: " + user.uid );

  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    console.log("no user data found");
  }

  const querySnapshot = await db.collectionGroup("contacts").where("email", "==", user.email).get();
  querySnapshot.forEach((doc:QueryDocumentSnapshot ) => {
    console.log(doc.id, " => ", doc.data());
    console.log("doc ref path" + doc.ref.path);
    console.log("Parent > Parent ID " + doc.ref.parent.parent?.id);

    // Send Mail -> Change to Create Admin for club
    return db.collection("mail").add({
      to: user.email,
      template: {
        name: "UserCreateWelcomeMail",
        data: {
          link: "LINK",
          firstName: userProfile.data().firstName,
        },
      },
    });
  });
}
/*
export async function authUserCreateSendVerifyMail(user: admin.auth.UserRecord, context: functions.EventContext) {
  // Send E-Mail that user has to verify his account first.
  if (!user.emailVerified) {
    const code = await admin.auth().generateEmailVerificationLink(user.email as string);

    return db.collection("mail").add({
      to: user.email,
      template: {
        name: "userCreateSendVerify",
        data: {
          code: code,
        },
      },
    });
  } else {
    return true;
  }
}
*/
