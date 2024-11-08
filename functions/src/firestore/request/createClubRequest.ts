/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from "../../scheduler/syncAssociation.scheduler";
import {sendPushNotificationByUserProfileId} from "../../utils/push";
const db = firebaseDAO.instance.db;

export async function createClubRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createClubRequest");
  const userId = context.params.userId;
  const clubId = context.params.clubId;

  const clubRef = await db.collection("club").doc(clubId).get();
  const club = clubRef.data();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();
  const user = userProfileRef.data();

  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  if (club && club.active == false) {
    // club ist noch nicht aktiv. -> Prüfen ob in der Contactliste eingetragen
    const contactDataRef = await db.collection("club").doc(clubId).collection("contacts").where("email", "==", user.email).get();
    console.log("ClubId" + clubId);
    console.log("User Email" + user.email);
    console.log("User Email" + contactDataRef.docs.length);

    if (contactDataRef.docs.length > 0) {
      // ACTIVATE CLUB!
      await db.collection("club").doc(clubId).set({
        active: true,
        subscriptionActive: false,
        subscroptionType: "",
      }, {merge: true});

      // Request kann angenommen werden.
      await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
        "userProfileRef": userProfileRef.ref,
        "approveDateTime": Date.now(),
        "approve": true,
        "isAdmin": true,
      });
      // REFRESH DB
      await updatePersistenceJobClubs(context);
      await updatePersistenceJobTeams(context);
      await updatePersistenceJobGames(context);
      await updatePersistenceJobNews(context);
    } else {
      // E-Mail, dass Request gelöscht wurde, da nicht bereichtig. Bitte info@my-club.app kontaktieren, sollte es sich um einen Fehler handeln.
      // Wird via Request rejected Methode gemacht. daher zuerst request ablehnen.
      await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
        "userProfileRef": userProfileRef.ref,
        "approveDateTime": Date.now(),
        "approve": false,
        "isAdmin": false,
      });
    }
  } else {
    // Club ist aktiv, normales Prozedere
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists && userProfileRef.data().settingsPush) {
      await sendPushNotificationByUserProfileId(
          userProfileRef.id,
          "Deine Beitrittsanfrage",
          "Wir haben deine Beitritsanfrage an den Club " + clubRef.data().name + " weitergeleitet",
          {
            "type": "clubRequest",
            "clubId": clubId,
            "id": clubId,
          }
      );
    }
    // SEND E-MAIL AND PUSH TO USER
    if (userProfileRef.exists) {
      // SEND REQUEST CONFIRMATION E-MAIL TO USER
      await db.collection("mail").add({
        to: userProfileRef.data()?.email,
        template: {
          name: "ClubRequestEmail",
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
    console.log(`Get Admin from Club: ${clubId}`);
    const clubAdminRef = await db.collection("club").doc(clubId).collection("admins").get();

    for (const admin of clubAdminRef.docs) {
      const adminRef = await db.collection("userProfile").doc(admin.id).get();
      if (adminRef.exists && adminRef.data().settingsPush) {
        await sendPushNotificationByUserProfileId(
            admin.id,
            "Neue Beitrittsanfrage für deinen Verein: " + clubRef.data().name,
            `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Verein beitreten.`,
            {
              "type": "clubRequestAdmin",
              "clubId": clubId,
              "id": clubId,
            }
        );
      }
      if (adminRef.exists && adminRef.data().settingsEmail === true) {
        receipient.push(adminRef.data().email);
      }
    }

    return db.collection("mail").add({
      to: receipient,
      template: {
        name: "ClubRequestAdminEmail",
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
