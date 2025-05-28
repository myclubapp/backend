/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
// import * as admin from 'firebase-admin';
import firebaseDAO from '../firebaseSingleton.js';
// import {AuthBlockingEvent} from 'firebase-functions/v2/identity';
import {logger} from 'firebase-functions';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/firestore';
import {UserRecord} from 'firebase-functions/v1/auth';
import {sendEmailByUserId} from '../utils/email.js';

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

/* export async function authBeforeUserSignedIn(event: AuthBlockingEvent): Promise<any> {
  logger.info('>>> authBeforeUserSignedIn', event?.data?.email);
  logger.info('>>> authBeforeUserSignedIn EmailVerified', event?.data?.emailVerified);
  return true;
} */

export async function createUserSendWelcomeEmail(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const {userId} = event.params;
  logger.info('>>> NEW USER with ID: ' + userId + ' SEND WELCOME E-MAIL to VALIDATE E-MAIL');

  // Daten werden in der Signup Methode in der App für den User gespeichert.
  const userProfileRef: any = await db.collection('userProfile').doc(`${userId}`).get();
  if (!userProfileRef.exists) {
    logger.error('no user data found');
    return false;
  }


  // const user = event.data;
  logger.info('>>> NEW USER with ID: ' + userId + ' SEND WELCOME E-MAIL to VALIDATE E-MAIL');
  const link = await auth.generateEmailVerificationLink(userProfileRef.data()?.email as string);

  logger.info('>>> UPDATE USER DATA');
  await auth.updateUser(userProfileRef.id, {
    displayName: userProfileRef.data()?.firstName + ' ' + userProfileRef.data()?.lastName,
    emailVerified: false,
    disabled: false,
    email: userProfileRef.data()?.email,
    photoURL: 'https://randomuser.me/api/portraits/lego/1.jpg',
  });

  logger.info('>>> SEND WELCOME MAIL TO USER ' + userProfileRef.data()?.email );
  return db.collection('mail').add({
    to: userProfileRef.data()?.email,
    template: {
      name: 'UserCreateWelcomeMail',
      data: {
        link: link,
        firstName: userProfileRef.data()?.firstName,
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

export async function onUserCreated(user: UserRecord) {
  if (user.email) {
    return sendEmailByUserId(user.uid, 'Welcome', {
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
    });
  }
  return null;
}
