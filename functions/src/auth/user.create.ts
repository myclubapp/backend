/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import firebaseDAO from "./../firebaseSingleton";

const db = firebaseDAO.instance.db;

/* export function authUserCreate(user: admin.auth.UserRecord, context: functions.EventContext) {
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

export async function authUserCreateSendWelcomeEmail(user: admin.auth.UserRecord, context: functions.EventContext) {
  console.log(">>> NEW USER with ID: " + user.uid + " SEND WELCOME MAIL");
  const link = await admin.auth().generateEmailVerificationLink(user.email as string);

  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    console.error("no user data found");
  }

  await admin.auth().updateUser(user.uid, {
    displayName: userProfile.data()?.firstName + " " + userProfile.data()?.lastName,
  });

  console.log(">>> SEND WELCOME MAIL TO USER " + user.email );
  return db.collection("mail").add({
    to: user.email,
    template: {
      name: "UserCreateWelcomeMail",
      data: {
        link: link,
        firstName: userProfile.data().firstName,
      },
    },
  });
}

export async function authUserCreateAdminUser(user: admin.auth.UserRecord, context: functions.EventContext) {
  console.log(">>> NEW USER with ID: " + user.uid + " CREATE ADMIN USER?");

  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    console.error("no user data found");
  }

  // CREATE ADMIN USER, IF CONTACT -> SPECIAL ONBOARDING
  const querySnapshot = await db.collectionGroup("contacts").where("email", "==", user.email).get();
  for (const doc of querySnapshot.docs) {
  // querySnapshot.forEach(async (doc:QueryDocumentSnapshot ) => {
    const clubId: string = doc.ref.parent.parent?.id || "";

    if (clubId == undefined) {
      console.log(">> NO clubId");
    } else {
      // Club aktivieren, falls noch nicht..
      // Könnte auch anders gemacht werden? bswp. falls aktiv, dann abbrechen?
      console.log(`Activate Club with ID: ${clubId}`);
      await db.collection("club").doc(clubId).set({
        "active": true,
      },
      {
        merge: true,
      });

      // ADD User to Club as Admin
      await db.collection("club").doc(clubId).collection("admins").doc(user.uid).set({
        "userProfileRef": userProfile.ref,
      });
      // ADD User to Club as Member
      await db.collection("club").doc(clubId).collection("members").doc(user.uid).set({
        "userProfileRef": userProfile.ref,
      });

      // Add ClubAdmin to User
      const clubRef = await db.collection("club").doc(clubId).get();
      await db.collection("userProfile").doc(user.uid).collection("clubAdmin").doc(clubId).set({
        "clubRef": clubRef.ref,
      });
      // Add Club to User
      await db.collection("userProfile").doc(user.uid).collection("clubs").doc(clubId).set({
        "clubRef": clubRef.ref,
      });

      console.log(`set user ${user.uid} custom claims for admin role: ${clubId}`);
      const userRef = await admin.auth().getUser(user.uid);
      const _customClaims = userRef.customClaims || {};
      _customClaims[clubId] = true;
      admin.auth().setCustomUserClaims(user.uid, _customClaims);

      // ADD TO ALL TEAMS
      const teamListRef = await db.collection("club").doc(clubId).collection("teams").get();
      for (const team of teamListRef.docs) {
        // ADD User to Club as Admin
        await db.collection("teams").doc(team.id).collection("admins").doc(user.uid).set({
          "userProfileRef": userProfile.ref,
        });
        // ADD User to Club as Member
        await db.collection("teams").doc(team.id).collection("members").doc(user.uid).set({
          "userProfileRef": userProfile.ref,
        });

        // Add Team Admin to User
        const teamRef = await db.collection("teams").doc(team.id).get();
        await db.collection("userProfile").doc(user.uid).collection("teamAdmin").doc(team.id).set({
          "teamRef": teamRef.ref,
        });
        // Add Club to User
        await db.collection("userProfile").doc(user.uid).collection("teams").doc(team.id).set({
          "teamRef": teamRef.ref,
        });
      }
    }

    // TODO
    // SEND MAIL TO CLUB ADMIN AND INFORM, THAT A NEW CLUB IS ACTIVE.
  }
}


// TODO-> IF CLUB ACTIVE
/* console.log("Update swissunihockey");
await updateClubsSwissunihockey();
await updateTeamsSwissunihockey();
await updateGamesSwissunihockey();
*/


/*
export async function authUserCreateSendVerifyMail(user: admin.auth.UserRecord, context: functions.EventContext) {
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
