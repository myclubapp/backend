

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
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

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
    await db.collection('mail').add({
      to: kidsUserProfileRef.data()?.email,
      from: 'noreply@my-club.app',
      subject: 'add family member to your account',
      body: {
        text: `Hi ${kidsUserProfileRef.data()?.firstName} ${kidsUserProfileRef.data()?.lastName}. ${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} wants to add you to your account. please open the link below to verify your email and add yourself to ${userProfileRef.data()?.firstName}'s account. Link: https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail?requestId=${requestId}&parentId=${userId}`,
        html: `Hi ${kidsUserProfileRef.data()?.firstName} ${kidsUserProfileRef.data()?.lastName}. ${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} wants to add you to your account. please open the link below to verify your email and add yourself to ${userProfileRef.data()?.firstName}'s account. Link: https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail?requestId=${requestId}&parentId=${userId}`,
      },
      /* template: {
        name: 'VerifyKidsEmail',
        data: {
          firstNameParent: userProfileRef.data()?.firstName,
          lastNameParent: userProfileRef.data()?.lastName,
          firstNameKid: kidsUserProfileRef.data()?.firstName,
          lastNameKid: kidsUserProfileRef.data()?.lastName,
          verificationLink: 'https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail' + '?requestId=' + kidId + '&parentId=' + userId,
        },
      },*/
    });
  } else {
    logger.info('kidsUserProfile does not exist');
  }
  return true;
}

// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
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
    customClaims.kids = customClaims.kids || [];
    customClaims.kids.push(kidProfileRef.id); // Set the kid id
    await auth.setCustomUserClaims(parentId, customClaims);
    logger.info(`User ${user.email} verified kid ${kidProfileRef.id}`);

    // Add Child to Parent
    const childrenRef = await db.collection('userProfile').doc(parentId).collection('children').get();
    childrenRef.doc(kidProfileRef.identity).set({
      email: kidProfileRef.data()?.email,
      firstName: kidProfileRef.data()?.firstName,
      lastName: kidProfileRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });
    // Delete Request
    await db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId).delete();

    return response.status(200).send('Kid verified');
  });
}
