/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {Change} from "firebase-functions";

const db = firebaseDAO.instance.db;

export async function approveClubRequest(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("approveClubRequest");
  const requestId = context.params.requestId;
  const clubId = context.params.clubId;

  const requestRef = await db.collection("club").doc(clubId).collection("requests").doc(requestId).get();
  const userProfileRef = await db.collection("userProfile").doc(requestId).get();
  const clubRef = await db.collection("club").doc(clubId).get();

  if (change.after.data().approve === true) {
    console.log(`approve club request ${requestRef.id}`);

    // Add user to club as member
    await db.collection("club").doc(clubId).collection("members").doc(userProfileRef.id).set({
      "userProfileRef": userProfileRef.ref,
    });

    // Add Club to User as Member
    await db.collection("userProfile").doc(userProfileRef.id).collection("clubs").doc(clubId).set({
      "clubRef": clubRef.ref,
    });

    // clean up requests
    await db.collection("userProfile").doc(userProfileRef.id).collection("clubRequests").doc(clubId).delete();
    await db.collection("club").doc(clubId).collection("requests").doc(requestId).delete();

    // send out mail to user
    return db.collection("mail").add({
      to: userProfileRef.data().email,
      template: {
        name: "ClubRequestApproved",
        data: {
          clubName: clubRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  } else if (change.after.data().approve === false) {
    console.log(`CLUB request NOT APPROVED ${requestRef.id}`);

    // clean up requests
    await db.collection("userProfile").doc(userProfileRef.id).collection("clubRequests").doc(clubId).delete();
    await db.collection("club").doc(clubId).collection("requests").doc(requestId).delete();

    // send out mail to user
    return db.collection("mail").add({
      to: userProfileRef.data().email,
      template: {
        name: "ClubRequestRejected",
        data: {
          clubName: clubRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
        },
      },
    });
  }
  return true;
}
