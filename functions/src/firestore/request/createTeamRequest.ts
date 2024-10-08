/* eslint-disable linebreak-style */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {sendPushNotificationByUserProfileId} from "../../utils/push";

const db = firebaseDAO.instance.db;

export async function createTeamRequest(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("createTeamRequest");
  const userId = context.params.userId;
  const teamId = context.params.teamId;

  const teamRef = await db.collection("teams").doc(teamId).get();
  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  await db.collection("teams").doc(teamId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  // SEND REQUEST CONFIRMATION E-MAIL TO USER
  await db.collection("mail").add({
    to: userProfileRef.data()?.email,
    template: {
      name: "TeamRequestEmail",
      data: {
        teamName: teamRef.data().liga + " " + teamRef.data().name,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
      },
    },
  });

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  console.log(`Get Admin from Club: ${teamRef.data().clubRef.id}`);
  const clubAdminRef = await db.collection("club").doc(teamRef.data().clubRef.id).collection("admins").get();
  for (const admin of clubAdminRef.docs) {
    console.log(`Read Admin user for Club with id ${admin.id}`);

    await sendPushNotificationByUserProfileId(
        admin.id,
        "Neue Beitrittsanfrage für dein Team: " + teamRef.data().name,
        `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
        {
        }
    );
  }

  // SEND REQUEST E-MAIL TO TEAM ADMIN
  const teamAdminRef = await db.collection("teams").doc(teamId).collection("admins").get();
  for (const admin of teamAdminRef.docs) {
    console.log(`Read Admin user for Team with id ${admin.id}`);
    const userProfileAdminRef = await db.collection("userProfile").doc(admin.id).get();
    if (userProfileAdminRef.exists) {
      if (userProfileAdminRef.data().settingsEmail) {
        receipient.push(userProfileAdminRef.data().email);
      }
      if (userProfileAdminRef.data().settingsPush === true) {
        await sendPushNotificationByUserProfileId(
            admin.id,
            "Neue Beitrittsanfrage für dein Team: " + teamRef.data().name,
            `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
            {
            }
        );
      }
    }
  }

  return db.collection("mail").add({
    to: receipient,
    template: {
      name: "TeamRequestAdminEmail",
      data: {
        teamName: `${teamRef.data().name}`,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
        email: userProfileRef.data()?.email,
      },
    },
  });

  // check if user has admin claims..
  /*
  const adminUserRef = snapshot.data().userProfileRef || false;
  if (adminUserRef) { // only provided in team Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[teamId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).set({
        "userProfileRef": userRef,
      });
    }
  } */
}

