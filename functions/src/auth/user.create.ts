/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
// import * as admin from 'firebase-admin';
import firebaseDAO from '../firebaseSingleton.js';
import {AuthBlockingEvent} from 'firebase-functions/v2/identity';
import {logger} from 'firebase-functions';
// import {UserRecord} from 'firebase-functions/v1/auth';

const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;

/* export function authUserCreate(user: admin.auth.UserRecord, context: EventContext) {
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

export async function authUserCreateSendWelcomeEmail(event: AuthBlockingEvent): Promise<any> {
  if (!event?.data) {
    throw new Error('No user data provided');
  }
  const user = event.data;
  logger.info('>>> NEW USER with ID: ' + user.uid + ' SEND WELCOME E-MAIL to VALIDATE E-MAIL');
  const link = await auth.generateEmailVerificationLink(user.email as string);

  const userProfile: any = await db.collection('userProfile').doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    logger.error('no user data found');
  }

  await auth.updateUser(user.uid, {
    displayName: userProfile.data()?.firstName + ' ' + userProfile.data()?.lastName,
  });

  logger.info('>>> SEND WELCOME MAIL TO USER ' + user.email );
  return db.collection('mail').add({
    to: user.email,
    template: {
      name: 'UserCreateWelcomeMail',
      data: {
        link: link,
        firstName: userProfile.data().firstName,
      },
    },
  });
}

/* export async function authUserCreateAdminUser(user: UserRecord): Promise<void> {
  logger.info('>>> authUserCreateAdminUser called for user: ' + user.uid);
  return Promise.resolve();
} */

// TODO-> IF CLUB ACTIVE
/* logger.info("Update swissunihockey");
await updateClubsSwissunihockey();
await updateTeamsSwissunihockey();
await updateGamesSwissunihockey();
*/


/*
export async function authUserCreateSendVerifyMail(user: admin.auth.UserRecord, context: EventContext) {
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
