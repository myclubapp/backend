
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from '../../scheduler/syncAssociation.scheduler.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function createClubRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('createClubRequest');

  // Sicherstellen, dass event.data existiert
  const snapshot = event.data;
  if (!snapshot) {
    logger.info('No data associated with the event');
    return;
  }

  // Zugriff auf Parameter aus dem Dokumentpfad
  const {userId, clubId} = event.params;

  const clubRef = await db.collection('club').doc(clubId).get();
  const club = clubRef.data();
  const userProfileRef = await db.collection('userProfile').doc(userId).get();
  // const user = userProfileRef.data();

  await db.collection('club').doc(clubId).collection('requests').doc(userId).set({
    'userProfileRef': userProfileRef.ref,
  });

  if (club && (club.active === undefined || club.active === false)) {
    // club ist noch nicht aktiv. -> Prüfen ob in der Contactliste eingetragen
    const contactDataRef = await db.collection('club').doc(clubId).collection('contacts').where('email', '==', userProfileRef.data()?.email).get();
    /* logger.info("ClubId" + clubId);
    logger.info("User Email" + userProfileRef.data()?.email);
    logger.info("User Email" + contactDataRef.docs.length); */

    if (contactDataRef.docs.length > 0) {
      // ACTIVATE CLUB!
      await db.collection('club').doc(clubId).set({
        active: true,
        subscriptionActive: false,
        subscriptionType: '',
      }, {merge: true});

      // TODO CREATE CLUB NEWS to have first NEWS Item.
      /* await db.collection("club").doc(`${club.id}`).collection("news").doc(`${club.id}-${news.id}`).set({
        externalId: `${news["id"]}`,
        title: news["title"].rendered,
        leadText: news["excerpt"].rendered,
        clubId: club.id,
        date: news["date"],
        slug: news["slug"],
        image: featuredMedia,
        text: news["content"].rendered,
        htmlText: news["content"].rendered || " ",
        tags: "Webseite",
        author: wpUser.name,
        authorImage: authorImage,
        url: news["link"],
        type: club.type,
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });*/

      // Request kann angenommen werden.
      await db.collection('club').doc(clubId).collection('requests').doc(userId).set({
        'userProfileRef': userProfileRef.ref,
        'approveDateTime': Date.now(),
        'approve': true,
        'isAdmin': true,
      });
      // REFRESH DB
      await updatePersistenceJobClubs({
        scheduleTime: new Date().toISOString(),
        jobName: 'manual-trigger',
      });
      await updatePersistenceJobTeams({
        scheduleTime: new Date().toISOString(),
        jobName: 'manual-trigger',
      });
      await updatePersistenceJobGames({
        scheduleTime: new Date().toISOString(),
        jobName: 'manual-trigger',
      });
      await updatePersistenceJobNews({
        scheduleTime: new Date().toISOString(),
        jobName: 'manual-trigger',
      });
    } else {
      // E-Mail, dass Request gelöscht wurde, da nicht bereichtig. Bitte info@my-club.app kontaktieren, sollte es sich um einen Fehler handeln.
      // Wird via Request rejected Methode gemacht. daher zuerst request ablehnen.
      await db.collection('club').doc(clubId).collection('requests').doc(userId).set({
        'userProfileRef': userProfileRef.ref,
        'approveDateTime': Date.now(),
        'approve': false,
        'isAdmin': false,
      });
    }
  } else {
    // Club ist aktiv, normales Prozedere
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists && userProfileRef.data().settingsPush) {
      await sendPushNotificationByUserProfileId(
          userProfileRef.id,
          'Deine Beitrittsanfrage',
          'Wir haben deine Beitritsanfrage an den Club ' + clubRef.data().name + ' weitergeleitet',
          {
            'type': 'clubRequest',
            'clubId': clubId,
            'id': clubId,
          },
      );
    }
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists) {
      // SEND REQUEST CONFIRMATION E-MAIL TO USER
      await db.collection('mail').add({
        to: userProfileRef.data()?.email,
        template: {
          name: 'ClubRequestEmail',
          data: {
            clubName: clubRef.data().name,
            firstName: userProfileRef.data()?.firstName,
            lastName: userProfileRef.data()?.lastName,
          },
        },
      });
    }

    // SEND REQUEST E-MAIL TO CLUB ADMIN
    const receipient = [];
    logger.info(`Get Admin from Club: ${clubId}`);
    const clubAdminRef = await db.collection('club').doc(clubId).collection('admins').get();

    for (const admin of clubAdminRef.docs) {
      const adminRef = await db.collection('userProfile').doc(admin.id).get();
      if (adminRef.exists && adminRef.data().settingsPush) {
        await sendPushNotificationByUserProfileId(
            admin.id,
            'Neue Beitrittsanfrage für deinen Verein: ' + clubRef.data().name,
            `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
            {
              'type': 'clubRequestAdmin',
              'clubId': clubId,
              'id': clubId,
            },
        );
      }
      if (adminRef.exists && adminRef.data().settingsEmail === true) {
        receipient.push(adminRef.data().email);
      }
    }

    // TODOOOOOOO CHECK IF THERE IS NO CLUB ADMIN -> NEW CLUB --> DELETE CLUB REQUEST???

    return db.collection('mail').add({
      to: receipient,
      template: {
        name: 'ClubRequestAdminEmail',
        data: {
          clubName: clubRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
          email: userProfileRef.data()?.email,
        },
      },
    });
  }
  return true;
}
