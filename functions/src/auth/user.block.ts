/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import {BeforeCreateUserResponse, BeforeSignInResponse, AuthBlockingEvent} from "firebase-functions/v2/identity";
// import * as admin from "firebase-admin";
// import firebaseDAO from "./../firebaseSingleton";

// const db = firebaseDAO.instance.db;

export async function authUserBlockBeforeCreate(event: AuthBlockingEvent): Promise<BeforeCreateUserResponse> {
// const user = event.data;
  // Block User if E-Mail is not @acme.com
  /* if (user.email && user.email.indexOf("@acme.com") === -1) {
    throw new Error(`Unauthorized email "${user.email}"`);
  } */
  return {
    allow: true,
  };
}

export async function authUserBlockBeforeSignIn(event: AuthBlockingEvent): Promise<BeforeSignInResponse> {
// const user = event.data;
  // log
  // E-Mail not verified
  /*
  console.log("authUserBlockBeforeSignIn");
  if (user.email && !user.emailVerified) {
    throw new functions.auth.HttpsError(
        "invalid-argument", `"${user.email}" needs to be verified before access is granted.`);
  }
  */
  return {
    allow: true,
  };
}
