/* eslint-disable max-len */
import {authUserDeleteUserSendByEmail, authUserDeleteUserAccount} from './auth/user.delete.js';
import {authUserCreateSendWelcomeEmail} from './auth/user.create.js';

import {createClubAdmin, createTeamAdmin} from './firestore/createAdmin.js';
import {createClubMember, createTeamMember} from './firestore/createMember.js';
import {deleteClubAdmin, deleteTeamAdmin} from './firestore/deleteAdmin.js';
import {deleteClubMember, deleteTeamMember} from './firestore/deleteMember.js';

import {createClubRequest} from './firestore/request/createClubRequest.js';
import {createTeamRequest} from './firestore/request/createTeamRequest.js';
import {deleteClubRequest} from './firestore/request/deleteClubRequest.js';
import {deleteTeamRequest} from './firestore/request/deleteTeamRequest.js';
import {approveClubRequest} from './firestore/request/approveClubRequest.js';
import {approveTeamRequest} from './firestore/request/approveTeamRequest.js';

import {createNotificationTeamTraining, createTeamTraining} from './firestore/training/createTeamTraining.js';

// import {createNotificationTeamEvent} from "./firestore/event/createTeamEvent";
import {createHelferEvent, createNotificationHelferEvent} from './firestore/event/createHelferEvent.js';
import {createClubEvent, createNotificationClubEvent} from './firestore/event/createClubEvent.js';

import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from './scheduler/syncAssociation.scheduler.js';
import {syncUnihockeyApp} from './scheduler/syncUnihockeyApp.js';

import {sendReportingJobMember} from './reporting/member.scheduler.js';

import {createNotificationClubNews} from './firestore/news/createClubNews.js';
import {createNotificationTeamNews} from './firestore/news/createTeamNews.js';
import {createNotificationNews} from './firestore/news/createNews.js';
import {exercisesScheduler} from './scheduler/exercise.scheduler.js';
import {confirmHelferEvent} from './firestore/event/confirmHelferEvent.js';
import {getGamePreview} from './requests/gamePreview/gamePreview.get.js';
import {leaveClubAsMember, leaveTeamAsMember} from './firestore/userProfile/leaveAsMember.js';
import {addClubTeam} from './firestore/club/createClubTeam.js';
import {createCheckoutSession, updateCheckoutSession, updateInvoice, updatePayments, updateSubscription} from './firestore/club/stripeCheckout.js';
import {deleteTeamTraining} from './firestore/training/deleteTeamTraining.js';
import {deleteClubEvent} from './firestore/event/deleteClubEvent.js';
import {deleteHelferEvent} from './firestore/event/deleteHelferEvent.js';
import {deleteTeamGame} from './firestore/game/deleteTeamGame.js';
import {deleteHelferPunkt} from './firestore/event/deleteHelferPunkt.js';
import {deleteTeam} from './firestore/team/deleteTeam.js';

import graphqlServer from './graphql/server.js';

import {onDocumentUpdated, onDocumentDeleted, onDocumentCreated, onDocumentWritten} from 'firebase-functions/v2/firestore';

import {beforeUserCreated} from 'firebase-functions/v2/identity';

// import {beforeUserDeleted} from 'firebase-functions/v2/auth';
import * as functions from 'firebase-functions/v1';

import {onSchedule} from 'firebase-functions/v2/scheduler';

import {onRequest} from 'firebase-functions/v2/https';


// Firebase AUTH Welcome User Stuff -> Updated to 2nd gen
export const sendWelcomeMail = beforeUserCreated({
  region: 'europe-west6',
}, authUserCreateSendWelcomeEmail);

/* still 1st gen
https://firebase.google.com/docs/functions/auth-events?authuser=0
Note: Cloud Functions for Firebase (2nd gen) does not provide support for the events and triggers described in this guide. Because 1st gen and 2nd gen functions can coexist side-by-side in the same source file, you can still develop and deploy this functionality together with 2nd gen functions.
*/
/* export const sendByeEmail = beforeUserDeleted({
  region: 'europe-west6',
}, authUserDeleteUserSendByEmail); // */

export const sendByeEmail = functions.auth.user().onDelete(authUserDeleteUserSendByEmail);


/* still 1st gen
 https://firebase.google.com/docs/functions/auth-events?authuser=0
 Note: Cloud Functions for Firebase (2nd gen) does not provide support for the events and triggers described in this guide. Because 1st gen and 2nd gen functions can coexist side-by-side in the same source file, you can still develop and deploy this functionality together with 2nd gen functions.
 */
/* export const deleteUserAccount = beforeUserDeleted({
  region: 'europe-west6',
}, authUserDeleteUserAccount);
*/
export const deleteUserAccount = functions.auth.user().onDelete(authUserDeleteUserAccount);

// NEW AUTH BLOCK FUNCTIONS -> Updated to 2nd gen


/* export const beforecreated = beforeUserCreated((_event): any => {
  return {
    allow: true,
  };
});*/

/* export const beforeSignIn = beforeUserSignedIn((_event): any => {
  return {
    allow: true,
  };
}); */

// GRAPHQL API -> Updated to 2nd gen
export const api = onRequest({
  region: 'europe-west6',
  timeoutSeconds: 300,
  memory: '1GiB',
}, graphqlServer);

// JOBS -> Updated to 2nd gen
export const jobUpdatePersistenceClubs = onSchedule({
  schedule: '00 08 * * 1',
  region: 'europe-west6',
  memory: '1GiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, updatePersistenceJobClubs);

export const jobUpdatePersistenceTeams = onSchedule({
  schedule: '10 08 * * 1',
  region: 'europe-west6',
  memory: '1GiB',
  timeoutSeconds: 540,
  timeZone: 'Europe/Zurich',
}, updatePersistenceJobTeams);

export const jobUpdatePersistenceGames = onSchedule({
  schedule: '00 06 * * *',
  region: 'europe-west6',
  memory: '512MiB',
  timeoutSeconds: 540,
  timeZone: 'Europe/Zurich',
}, updatePersistenceJobGames);

export const jobUpdatePersistenceNews = onSchedule({
  schedule: '30 * * * *',
  region: 'europe-west6',
  memory: '512MiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, updatePersistenceJobNews);

export const jobSyncUnihockeyApp = onSchedule({
  schedule: '30 * * * *',
  region: 'europe-west6',
  memory: '512MiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, syncUnihockeyApp);

export const jobYoutube = onSchedule({
  schedule: '00 08 * * 1',
  region: 'europe-west6',
  memory: '512MiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, exercisesScheduler);

// Reporting -> Updated to 2nd gen
export const jobReportingMember = onSchedule({
  schedule: '00 20 * * 0',
  region: 'europe-west6',
  memory: '256MiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, sendReportingJobMember);

// DB Hooks TEAM > Manage teams currently only available for ADMIN
export const dbDeleteTeam = onDocumentDeleted({
  document: '/teams/{teamId}',
  region: 'europe-west6',
}, deleteTeam);

export const dbRemoveTeamMember = onDocumentDeleted({
  document: '/teams/{teamId}/members/{userId}',
  region: 'europe-west6',
}, deleteTeamMember);

export const dbRemoveTeamAdmin = onDocumentDeleted({
  document: '/teams/{teamId}/admins/{userId}',
  region: 'europe-west6',
}, deleteTeamAdmin);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamMember = onDocumentCreated({
  document: '/teams/{teamId}/members/{userId}',
  region: 'europe-west6',
}, createTeamMember);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamAdmin = onDocumentCreated({
  document: '/teams/{teamId}/admins/{userId}',
  region: 'europe-west6',
}, createTeamAdmin);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbLeaveTeamAsMember = onDocumentDeleted({
  document: '/userProfile/{userId}/teams/{teamId}',
  region: 'europe-west6',
}, leaveTeamAsMember);

// DB Hooks CLUB > Manage club currently only available for ADMIN
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbRemoveClubMember = onDocumentDeleted({
  document: '/club/{clubId}/members/{userId}',
  region: 'europe-west6',
}, deleteClubMember);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbRemoveClubAdmin = onDocumentDeleted({
  document: '/club/{clubId}/admins/{userId}',
  region: 'europe-west6',
}, deleteClubAdmin);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubMember = onDocumentCreated({
  document: '/club/{clubId}/members/{userId}',
  region: 'europe-west6',
}, createClubMember);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubAdmin = onDocumentCreated({
  document: '/club/{clubId}/admins/{userId}',
  region: 'europe-west6',
}, createClubAdmin);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbLeaveClubAsMember = onDocumentDeleted({
  document: '/userProfile/{userId}/clubs/{clubId}',
  region: 'europe-west6',
}, leaveClubAsMember);

// DB Hooks STRIPE
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddCheckoutSession = onDocumentCreated({
  document: '/club/{clubId}/checkout_sessions/{sessionId}',
  region: 'europe-west6',
}, createCheckoutSession);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbChangeCheckoutSession = onDocumentUpdated({
  document: '/userProfile/{userId}/checkout_sessions/{sessionId}',
  region: 'europe-west6',
}, updateCheckoutSession);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbChangeSubscription = onDocumentWritten({
  document: '/userProfile/{userId}/subscriptions/{subscriptionId}',
  region: 'europe-west6',
}, updateSubscription);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbChangeInvoice = onDocumentWritten({
  document: '/userProfile/{userId}/subscriptions/{subscriptionId}/invoices/{invoiceId}',
  region: 'europe-west6',
}, updateInvoice);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbChangePayment = onDocumentWritten({
  document: '/userProfile/{userId}/payments/{paymentId}',
  region: 'europe-west6',
}, updatePayments);

// DB Hooks REQUESTS
// user perspective: create Request in onboarding

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubRequest = onDocumentCreated({
  document: '/userProfile/{userId}/clubRequests/{clubId}',
  region: 'europe-west6',
}, createClubRequest);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamRequest = onDocumentCreated({
  document: '/userProfile/{userId}/teamRequests/{teamId}',
  region: 'europe-west6',
}, createTeamRequest);

// user perspective: delete Request in profile
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbRemoveClubRequest = onDocumentDeleted({
  document: '/userProfile/{userId}/clubRequests/{clubId}',
  region: 'europe-west6',
}, deleteClubRequest);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbRemoveTeamRequest = onDocumentDeleted({
  document: '/userProfile/{userId}/teamRequests/{teamId}',
  region: 'europe-west6',
}, deleteTeamRequest);

// approve or delete request in team / club management page from admin perspective
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbApproveClubRequest = onDocumentUpdated({
  document: '/club/{clubId}/requests/{requestId}',
  region: 'europe-west6',
}, approveClubRequest);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbApproveTeamRequest = onDocumentUpdated({
  document: '/teams/{teamId}/requests/{requestId}',
  region: 'europe-west6',
}, approveTeamRequest);

// DB Hooks CLUB > TEAMS
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubTeam = onDocumentCreated({
  document: '/club/{clubId}/teams/{teamId}',
  region: 'europe-west6',
}, addClubTeam);

// DB Hooks TRAININGS from USER Profile
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamTraining = onDocumentCreated({
  document: '/userProfile/{userId}/trainings/{trainingId}',
  region: 'europe-west6',
}, createTeamTraining);

// DB Hooks EVENTS from USER Profile
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubEvent = onDocumentCreated({
  document: '/userProfile/{userId}/clubEvents/{eventId}',
  region: 'europe-west6',
}, createClubEvent);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddHelferEvent = onDocumentCreated({
  document: '/userProfile/{userId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, createHelferEvent);

// HELFER EVENTS DB HOOKS
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbConfirmHelferEvent = onDocumentUpdated({
  document: '/club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}',
  region: 'europe-west6',
}, confirmHelferEvent);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbRemoveHelerPunkt = onDocumentDeleted({
  document: '/club/{clubId}/helferPunkte/{helferPunktId}',
  region: 'europe-west6',
}, deleteHelferPunkt);


// NOTIFICATION DB HOOKS

// DB Hooks for News Push
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubNewsNotification = onDocumentCreated({
  document: '/club/{clubId}/news/{newsId}',
  region: 'europe-west6',
}, createNotificationClubNews);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamNewsNotification = onDocumentCreated({
  document: '/teams/{teamId}/news/{newsId}',
  region: 'europe-west6',
}, createNotificationTeamNews);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddNewsNotification = onDocumentCreated({
  document: '/news/{newsId}',
  region: 'europe-west6',
}, createNotificationNews);

// DB Hooks for New Events
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddClubEventNotification = onDocumentCreated({
  document: '/club/{clubId}/events/{eventId}',
  region: 'europe-west6',
}, createNotificationClubEvent);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddHelferEventNotification = onDocumentCreated({
  document: '/club/{clubId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, createNotificationHelferEvent);
// export const dbAddTeamEventNotification = functions.region("europe-west6").firestore.document("/teams/{teamId}/event/{eventId}").onCreate(createNotificationTeamEvent);

// DB Hooks for Training Push
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbAddTeamTrainingNotification = onDocumentCreated({
  document: '/userProfile/{userId}/trainings/{trainingId}',
  region: 'europe-west6',
}, createNotificationTeamTraining);

// DB HOOKS DELETE TRAINING, EVENTS, HELFEREVENTS
// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbDeleteTraining = onDocumentDeleted({
  document: '/teams/{teamId}/trainings/{trainingId}',
  region: 'europe-west6',
}, deleteTeamTraining);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbDeleteTeamGame = onDocumentDeleted({
  document: '/teams/{teamId}/games/{gameId}',
  region: 'europe-west6',
}, deleteTeamGame);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbDeleteClubEvent = onDocumentDeleted({
  document: '/club/{clubId}/events/{eventId}',
  region: 'europe-west6',
}, deleteClubEvent);

// Das hier ist korrekt!!! https://firebase.google.com/docs/functions/firestore-events?hl=de&gen=2nd
export const dbDeleteHelferEvent = onDocumentDeleted({
  document: '/club/{clubId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, deleteHelferEvent);


// TOTOMAT
export const totomat = onRequest({
  region: 'europe-west6',
  memory: '1GiB',
}, graphqlServer);

// Game Preview -> Updated to 2nd gen
export const gamePreview = onRequest({
  region: 'europe-west6',
}, getGamePreview);
