/* eslint-disable linebreak-style */
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

        if (userProfile.data().settingsEmailReporting) {
          // Prepare data
          const nlClubNews = [];
          const calculatedDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();


          // GET ALL TEAMS & CLUBS for Member
          const teamList = await db.collection("userProfile").doc(userProfile.id).collection("teams").get();
          if (!teamList.empty) {
            // Loop über Teams
            for (const team of teamList.docs) {
              console.log(`> Team ${team.id}`);
              /*
              const teamTrainingList = await db.collection("teams").doc(team.id).collection("training").where().get();
              const teamNewsList = await db.collection("teams").doc(team.id).collection("news").where().get();
              */
            }
          }

          const clubList = await db.collection("userProfile").doc(userProfile.id).collection("clubs").get();
          if (!clubList.empty) {
            // Loop über Clubs
            for (const club of clubList.docs) {
              console.log(`> Club ${club.id}`);

              const clubNewsList = await db.collection("clib").doc(club.id).collection("news").where("date", ">=", calculatedDate).get();
              if (!clubNewsList.empty) {
                for (const clubNews of clubNewsList.docs) {
                  nlClubNews.push(clubNews);
                }
              }

              /* const clubNewsList = await db.collection("club").doc(club.id).collection("news").where().get();
              const clubEventsList = await db.collection("club").doc(club.id).collection("events").where().get();
              const clubHelferEventsList = await db.collection("club").doc(club.id).collection("helfer").where().get();
              */
            }
          }

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
                clubNews: nlClubNews,
              },
            }});
        } else {
          console.log(`Kein Reporting: ${userProfile.data().firstName}`);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function getNews() {
  console.log("Get Past News from Member");
}

function getTrainings() {
  console.log("training");
}

function getEvents() {
  console.log("events");
}
