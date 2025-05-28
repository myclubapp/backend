/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {ScheduledEvent} from 'firebase-functions/v2/scheduler';
import {logger} from 'firebase-functions';
// import * as firebase from "firebase-admin";
import firebaseDAO from './../firebaseSingleton.js';
import {sendEmailByUserId} from '../utils/email.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;

export async function sendReportingJobMember(event: ScheduledEvent) {
  try {
    logger.info('>> START Reporting ');
    const userProfileList = await db.collection('userProfile').get();
    if (!userProfileList.empty) {
      // Loop über Profiles
      for (const userProfile of userProfileList.docs) {
        logger.info(`>>> ${userProfile.data().firstName}`);

        if (userProfile.data().settingsEmailReporting) {
          // Prepare data
          const nlClubNews = [];
          const calculatedDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();


          // GET ALL TEAMS & CLUBS for Member
          const teamList = await db.collection('userProfile').doc(userProfile.id).collection('teams').get();
          if (!teamList.empty) {
            // Loop über Teams
            for (const team of teamList.docs) {
              logger.info(`> Team ${team.id}`);
              /*
              const teamTrainingList = await db.collection("teams").doc(team.id).collection("training").where().get();
              const teamNewsList = await db.collection("teams").doc(team.id).collection("news").where().get();
              */
            }
          }

          const clubList = await db.collection('userProfile').doc(userProfile.id).collection('clubs').get();
          if (!clubList.empty) {
            // Loop über Clubs
            for (const club of clubList.docs) {
              logger.info(`> Club ${club.id}`);

              logger.info('Read news back to: ' + calculatedDate);
              const clubNewsList = await db.collection('club').doc(club.id).collection('news').where('date', '>=', calculatedDate).get();
              if (!clubNewsList.empty) {
                for (const clubNews of clubNewsList.docs) {
                  logger.info('>> News: ' + clubNews);
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

          await db.collection('mail').add({
            to: userProfile.data().email,
            template: {
              name: 'ReportingUser',
              data: {
                firstName: userProfile.data().firstName,
                clubNews: nlClubNews,
              },
            }});
        } else {
          logger.info(`Kein Reporting: ${userProfile.data().firstName}`);
        }
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

function getNews() {
  logger.info('Get Past News from Member');
}

function getTrainings() {
  logger.info('training');
}

function getEvents() {
  logger.info('events');
}

export async function onMemberReport(event: FirestoreEvent<QueryDocumentSnapshot>) {
  const reportData = event.data.data();
  const userId = event.data.id;

  await sendEmailByUserId(userId, 'MemberReport', {
    firstName: reportData.firstName,
    lastName: reportData.lastName,
    reportDate: new Date().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
    reportData: reportData.data,
  });
}
