/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
// import * as admin from "firebase-admin";
// import firebaseDAO from "./../firebaseSingleton";


export async function authUserBlockBeforeCreate(
    event: any) {
  // const user = event.data;
  // Block User if E-Mail is not @acme.com
  /* if (user.email && user.email.indexOf("@acme.com") === -1) {
    throw new Error(`Unauthorized email "${user.email}"`);
  } */
  return {
    allow: true,
  };
}

export async function authUserBlockBeforeSignIn(
    event: any ) {
  // const user = event.data;
  // log
  // E-Mail not verified
  /*
  logger.info("authUserBlockBeforeSignIn");
  if (user.email && !user.emailVerified) {
    throw new functions.auth.HttpsError(
        "invalid-argument", `"${user.email}" needs to be verified before access is granted.`);
  }
  */
  return {
    allow: true,
  };
}
