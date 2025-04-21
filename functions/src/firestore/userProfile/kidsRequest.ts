/* eslint-disable max-len */

import {QueryDocumentSnapshot, FirestoreEvent} from 'firebase-functions/v2/firestore';
import firebaseDAO from '../../firebaseSingleton.js';
const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;
import {logger} from 'firebase-functions';
import cors from 'cors';
import * as functions from 'firebase-functions/v1';

export async function createKid(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const {userId, requestId} = event.params;
  logger.info(`Add Kid to UserProfile ${userId} with requestId ${requestId}`);

  const kidData = event.data?.data();
  const parentProfileRef = await db.collection('userProfile').doc(userId).get();

  // search for kid with email
  const kidsUserProfileRefCollection = await db.collection('userProfile').where('email', '==', kidData?.email).get();
  if (kidsUserProfileRefCollection.docs.length > 0) {
    logger.info('kidsUserProfile exists');
    // assume there is only one kid with the same email as profile
    const tempKidsUserProfileRef = kidsUserProfileRefCollection.docs[0];
    const kidsUserProfileRef = await db.collection('userProfile').doc(tempKidsUserProfileRef.id).get();
    // logger.info('kidsUserProfile: ' + kidsUserProfileRef.data());

    // Update Request Data
    await db.collection('userProfile').doc(userId).collection('kidsRequests').doc(requestId).set({
      kidsUserProfileRefId: kidsUserProfileRef.id,
    }, {merge: true});

    // send verification email
    return db.collection('mail').add({
      to: kidsUserProfileRef.data()?.email,
      template: {
        name: 'VerifyKidsEmail',
        data: {
          firstNameParent: parentProfileRef.data()?.firstName,
          lastNameParent: parentProfileRef.data()?.lastName,
          firstNameKid: kidsUserProfileRef.data()?.firstName,
          lastNameKid: kidsUserProfileRef.data()?.lastName,
          verificationLink: 'https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail' + '?requestId=' + requestId + '&parentId=' + userId,
        },
      },
    });
  } else {
    logger.info('kidsUserProfile does not exist');
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyKidsEmailService(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  corsHandler(request, response, async () => {
    const {requestId, parentId} = request.query;
    logger.info(`Verify Kids with requestId ${requestId}`);
    const kidRef = await db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId).get();
    if (!kidRef.exists) {
      return response.status(404).send('Kid request not found');
    }
    const kidProfileRef = await db.collection('userProfile').doc(kidRef.data()?.kidsUserProfileRefId).get();
    // update custom claims for parent
    const user = await auth.getUser(parentId);
    const customClaims = user.customClaims || {};
    customClaims['kids-' + kidProfileRef.id] = true;
    await auth.setCustomUserClaims(parentId, customClaims);
    logger.info(`User ${user.email} verified kid ${kidProfileRef.id}`);

    // Add Child to Parent
    await db.collection('userProfile').doc(parentId).collection('children').doc(kidProfileRef.id).set({
      email: kidProfileRef.data()?.email,
      firstName: kidProfileRef.data()?.firstName,
      lastName: kidProfileRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });

    // Set Parent to Kid
    const parentRef = await db.collection('userProfile').doc(parentId).get();
    await db.collection('userProfile').doc(kidProfileRef.id).collection('parents').doc(parentRef.id).set({
      email: parentRef.data()?.email,
      firstName: parentRef.data()?.firstName,
      lastName: parentRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });

    // Delete Request
    await db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId).delete();

    return response
        .status(200)
        .set('Content-Type', 'text/html')
        .send(`
        <!DOCTYPE html>
        <html lang="de">
          <head>
            <meta charset="UTF-8">
            <title>Kind verifiziert</title>
          </head>
          <body>
            <h1>Kind wurde erfolgreich verifiziert!</h1>
            <p>Vielen Dank für deine Bestätigung.</p>
          </body>
        </html>
      `);
  });
}
