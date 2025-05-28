/* eslint-disable max-len */
import {logger} from 'firebase-functions';
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot, Change} from 'firebase-functions/v2/firestore';
import {sendEmailByUserId} from '../../utils/email.js';

const db = firebaseDAO.instance.db;

export async function approveClubRequest(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('approveClubRequest');
  const {requestId, clubId} = event.params;

  const requestRef = await db.collection('club').doc(clubId).collection('requests').doc(requestId).get();
  const userProfileRef = await db.collection('userProfile').doc(requestId).get();
  const clubRef = await db.collection('club').doc(clubId).get();

  if (event.data?.after.data().approve === true) {
    logger.info(`approve club request ${requestRef.id}`);

    if ('isParent' in event.data.after.data() && event.data?.after.data().isParent === true) {
      // Add user to club as parent
      await db.collection('club').doc(clubId).collection('parents').doc(userProfileRef.id).set({
        'userProfileRef': userProfileRef.ref,
      });
      // Add Club to User as Member --> should alread be done.
      await db.collection('userProfile').doc(userProfileRef.id).collection('clubs').doc(clubId).set({
        'clubRef': clubRef.ref,
      });

      await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

      return true;
    }

    // Add user to club as member
    await db.collection('club').doc(clubId).collection('members').doc(userProfileRef.id).set({
      'userProfileRef': userProfileRef.ref,
    });

    // Add Club to User as Member
    await db.collection('userProfile').doc(userProfileRef.id).collection('clubs').doc(clubId).set({
      'clubRef': clubRef.ref,
    });

    // IS manged via createClubRequest and Club is not acitve.
    if (event.data?.after.data().isAdmin === true) {
      // ADD User to Club as Admin
      await db.collection('club').doc(clubId).collection('admins').doc(userProfileRef.id).set({
        'userProfileRef': userProfileRef.ref,
      });
      // Add ClubAdmin to User
      const clubRef = await db.collection('club').doc(clubId).get();
      await db.collection('userProfile').doc(userProfileRef.id).collection('clubAdmin').doc(clubId).set({
        'clubRef': clubRef.ref,
      });
    }

    // clean up requests
    await db.collection('userProfile').doc(userProfileRef.id).collection('clubRequests').doc(clubId).delete();
    await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

    // send out mail to user
    await sendEmailByUserId(userProfileRef.id, 'ClubRequestApproved', {
      clubName: clubRef.data().name,
      firstName: userProfileRef.data()?.firstName,
      lastName: userProfileRef.data()?.lastName,
    });

    return true;
  } else if (event.data?.after.data().approve === false) {
    logger.info(`CLUB request NOT APPROVED ${requestRef.id}`);

    // clean up requests
    await db.collection('userProfile').doc(userProfileRef.id).collection('clubRequests').doc(clubId).delete();
    await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

    // send out mail to user
    await sendEmailByUserId(userProfileRef.id, 'ClubRequestRejected', {
      clubName: clubRef.data().name,
      firstName: userProfileRef.data()?.firstName,
      lastName: userProfileRef.data()?.lastName,
    });

    return true;
  }
  return true;
}
