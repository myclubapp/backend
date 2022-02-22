/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

export function authUserCreate(user: admin.auth.UserRecord, context: functions.EventContext) {
  db.collection("userProfile").doc(`${user.uid}`).set({
    "email": user.email,
    "id": user.uid,
  }, {
    merge: true,
  }).then((ok) => {
    return "ok";
  }).catch((e) => {
    return "error";
  });
}

export async function authUserCreateSendWelcomeMail(user: admin.auth.UserRecord, context: functions.EventContext) {
  const code = await admin.auth().generateEmailVerificationLink(user.email as string);
  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  return db.collection("mail").add({
    to: user.email,
    template: {
      name: "userCreateWelcome",
      data: {
        code: code,
        firstName: userProfile.data().firstName,
      },
    },
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
