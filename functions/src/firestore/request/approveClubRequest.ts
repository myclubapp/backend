/* eslint-disable max-len */
import {logger} from 'firebase-functions';
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot, Change} from 'firebase-functions/v2/firestore';
import {sendEmailByUserId} from '../../utils/email.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';

const db = firebaseDAO.instance.db;

export async function approveClubRequest(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('approveClubRequest');
  const {requestId, clubId} = event.params;
  const request = event.data?.after.data();
  if (!request) {
    return true;
  }

  const requestRef = await db.collection('club').doc(clubId).collection('requests').doc(requestId).get();
  const userProfileRef = await db.collection('userProfile').doc(requestId).get();
  const clubRef = await db.collection('club').doc(clubId).get();
  const mailData = {
    clubName: clubRef.data()?.name,
    firstName: userProfileRef.data()?.firstName,
    lastName: userProfileRef.data()?.lastName,
  };

  if (request.approve === true) {
    logger.info(`approve club request ${requestRef.id}`);

    if (request.isParent === true) {
      logger.info(`approve club request ${requestRef.id} isParent`);
      // Add user to club as parent
      await db.collection('club').doc(clubId).collection('parents').doc(userProfileRef.id).set({
        'userProfileRef': userProfileRef.ref,
      });
      // Add Club to User
      await db.collection('userProfile').doc(userProfileRef.id).collection('clubs').doc(clubId).set({
        'clubRef': clubRef.ref,
      });
      // Profil-Flag: daran hängen die Hinweis-Karte auf der News-Seite und die Elternlogik in member.page
      await db.collection('userProfile').doc(userProfileRef.id).set({isParent: true}, {merge: true});

      // clean up requests on both sides, sonst bleibt die Anfrage im Onboarding als offen stehen
      await db.collection('userProfile').doc(userProfileRef.id).collection('clubRequests').doc(clubId).delete();
      await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

      // Mail mit den nächsten Schritten (Template steht in alwaysSendTemplates), Push und In-App-Nachricht
      await sendEmailByUserId(userProfileRef.id, 'ClubRequestApprovedParent', mailData, false);
      if (userProfileRef.exists && userProfileRef.data()?.settingsPush) {
        await sendPushNotificationByUserProfileId(
            userProfileRef.id,
            `Elternkonto für ${mailData.clubName} freigegeben`,
            'Nächster Schritt: Konto deines Kindes erstellen und im Profil unter «Kinder» verknüpfen.',
            {
              'type': 'clubRequest',
              'clubId': clubId,
              'id': clubId,
            },
        );
      }
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

    // Elternteil wird Mitglied desselben Clubs: Eltern-Eintrag entfernen und Profil-Flag zurücksetzen.
    // Ist die Person in einem anderen Club weiterhin Elternteil, wird das Flag dort nicht neu gesetzt.
    const parentRef = await db.collection('club').doc(clubId).collection('parents').doc(userProfileRef.id).get();
    if (parentRef.exists) {
      await parentRef.ref.delete();
      await db.collection('userProfile').doc(userProfileRef.id).set({isParent: false}, {merge: true});
    }

    // IS manged via createClubRequest and Club is not acitve.
    if (request.isAdmin === true) {
      // ADD User to Club as Admin
      await db.collection('club').doc(clubId).collection('admins').doc(userProfileRef.id).set({
        'userProfileRef': userProfileRef.ref,
      });
      // Add ClubAdmin to User
      await db.collection('userProfile').doc(userProfileRef.id).collection('clubAdmin').doc(clubId).set({
        'clubRef': clubRef.ref,
      });
    }

    // clean up requests
    await db.collection('userProfile').doc(userProfileRef.id).collection('clubRequests').doc(clubId).delete();
    await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

    // send out mail to user
    await sendEmailByUserId(userProfileRef.id, 'ClubRequestApproved', mailData);

    return true;
  } else if (request.approve === false) {
    logger.info(`CLUB request NOT APPROVED ${requestRef.id}`);

    // clean up requests
    await db.collection('userProfile').doc(userProfileRef.id).collection('clubRequests').doc(clubId).delete();
    await db.collection('club').doc(clubId).collection('requests').doc(requestId).delete();

    // send out mail to user
    await sendEmailByUserId(userProfileRef.id, 'ClubRequestRejected', mailData, false);

    return true;
  }
  return true;
}
