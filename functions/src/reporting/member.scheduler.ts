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
    console.log(">> START Reporting ");
    const userProfileList = await db.collection("userProfile").get();
    if (!userProfileList.empty) {
      // Loop über Profiles
      for (const userProfile of userProfileList.docs) {
        console.log(`>>> ${userProfile.data().firstName}`);

        const userProfileReporting = await db.collection("userProfile").doc(`${userProfile.id}`).collection("reporting").get();
        if (!userProfileReporting.empty) {
          // Loop über Reporting
          for (const reporting of userProfileReporting.docs) {
            console.log(`${reporting.id}`);
            if (reporting.id === "email") {
              console.log(`Reporting: ${reporting.data()}`);

              // GET DATA
              getNews();
              getEvents();
              getTrainings();

              await db.collection("mail").add({
                to: userProfile.data().email,
                template: {
                  name: "ReportingUser",
                  data: {
                    firstName: userProfile.data().firstName,
                  },
                }});
            } else {
              console.log(`Kein Reporting: ${reporting.data()}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function getNews() {
  console.log("news");
}

function getTrainings() {
  console.log("training");
}

function getEvents() {
  console.log("events");
}
