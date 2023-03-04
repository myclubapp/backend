/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {AuthUserRecord} from "firebase-functions/lib/common/providers/identity";
// import * as admin from "firebase-admin";
// import firebaseDAO from "./../firebaseSingleton";

// const db = firebaseDAO.instance.db;

export async function authUserBlockBeforeCreate(user: AuthUserRecord, context: functions.EventContext) {
  // Block User if E-Mail is not @acme.com
  /* if (user.email && user.email.indexOf("@acme.com") === -1) {
    throw new functions.auth.HttpsError(
        "invalid-argument",
        `Unauthorized email "${user.email}"`
    );
  } */
}

export async function authUserBlockBeforeSignIn(user: AuthUserRecord, context: functions.EventContext) {
  // log
  // E-Mail not verified
  /*
  console.log("authUserBlockBeforeSignIn");
  if (user.email && !user.emailVerified) {
    throw new functions.auth.HttpsError(
        "invalid-argument", `"${user.email}" needs to be verified before access is granted.`);
  }
  */
}
