/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";

// import * as firebase from "firebase-admin";
import firebaseDAO from "./../firebaseSingleton";

const db = firebaseDAO.instance.db;

export async function sendReportingJobMember(context: EventContext) {
  try {
    console.log("theme");
    const userProfileRef = await db.collection("userProfile").get();
    for (const userProfile of userProfileRef) {
      const userProfileReporting = await db.collection("userProfile").doc(`${userProfile.id}`).collection("reporting").get();
      for (const reporting of userProfileReporting) {
        console.log(reporting.data());
        if (reporting.id === "email") {
          console.log(reporting.data());
          await db.collection("mail").add({
            to: userProfile.data().email,
            template: {
              name: "ReportingUser",
              data: {
                firstName: userProfile.data().firstName,
              },
            }});
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
