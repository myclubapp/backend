/* eslint-disable linebreak-style */
/* eslint-disable max-len */
import {authUserBlockBeforeCreate, authUserBlockBeforeSignIn} from "./auth/user.block";

import {authUserCreateSendWelcomeEmail} from "./auth/user.create";
// eslint-disable-next-line import/namespace
import {authUserDeleteUserSendByEmail, authUserDeleteUserAccount} from "./auth/user.delete";
import {createClubAdmin, createTeamAdmin} from "./firestore/createAdmin";
import {createClubMember, createTeamMember} from "./firestore/createMember";
import {deleteClubAdmin, deleteTeamAdmin} from "./firestore/deleteAdmin";
import {deleteClubMember, deleteTeamMember} from "./firestore/deleteMember";
import {createClubRequest} from "./firestore/request/createClubRequest";
import {createTeamRequest} from "./firestore/request/createTeamRequest";
import {deleteClubRequest} from "./firestore/request/deleteClubRequest";
import {deleteTeamRequest} from "./firestore/request/deleteTeamRequest";
import {approveClubRequest} from "./firestore/request/approveClubRequest";
import {approveTeamRequest} from "./firestore/request/approveTeamRequest";

import {createNotificationTeamTraining, createTeamTraining} from "./firestore/training/createTeamTraining";

// import {createNotificationTeamEvent} from "./firestore/event/createTeamEvent";
import {createHelferEvent, createNotificationHelferEvent} from "./firestore/event/createHelferEvent";
import {createClubEvent, createNotificationClubEvent} from "./firestore/event/createClubEvent";

import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from "./scheduler/syncAssociation.scheduler";
import {syncUnihockeyApp} from "./scheduler/syncUnihockeyApp";

import {sendReportingJobMember} from "./reporting/member.scheduler";

import {createNotificationClubNews} from "./firestore/news/createClubNews";
import {createNotificationTeamNews} from "./firestore/news/createTeamNews";
import {createNotificationNews} from "./firestore/news/createNews";
import {exercisesScheduler} from "./scheduler/exercise.scheduler";
import {confirmHelferEvent} from "./firestore/event/confirmHelferEvent";
import {getGamePreview} from "./requests/gamePreview/gamePreview.get";
import {leaveClubAsMember, leaveTeamAsMember} from "./firestore/userProfile/leaveAsMember";
import {addClubTeam} from "./firestore/club/createClubTeam";
import {createCheckoutSession, updateCheckoutSession, updateInvoice, updatePayments, updateSubscription} from "./firestore/club/stripeCheckout";
import {deleteTeamTraining} from "./firestore/training/deleteTeamTraining";
import {deleteClubEvent} from "./firestore/event/deleteClubEvent";
import {deleteHelferEvent} from "./firestore/event/deleteHelferEvent";
import {deleteTeamGame} from "./firestore/game/deleteTeamGame";
import {deleteHelferPunkt} from "./firestore/event/deleteHelferPunkt";
import {deleteTeam} from "./firestore/team/deleteTeam";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphql = require("./graphql/server");

import {beforeUserDeleted, beforeUserCreated, beforeUserSignedIn} from "firebase-functions/v2/auth";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onDocumentDeleted, onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onRequest} from "firebase-functions/v2/https";

// Firebase AUTH Welcome User Stuff

// export const onCreateUserCreateAdminUser = functions.region("europe-west6").auth.user().onCreate(authUserCreateAdminUser);
export const sendWelcomeMail = beforeUserCreated({
  region: "europe-west6",
}, authUserCreateSendWelcomeEmail);

export const sendByeEmail = beforeUserDeleted({
  region: "europe-west6",
}, authUserDeleteUserSendByEmail);

export const deleteUserAccount = beforeUserDeleted({
  region: "europe-west6",
}, authUserDeleteUserAccount);

// NEW AUTH BLOCK FUNCTIONS
export const beforeCreate = beforeUserCreated({
  region: "europe-west6",
}, authUserBlockBeforeCreate);

export const beforeSignIn = beforeUserSignedIn({
  region: "europe-west6",
}, authUserBlockBeforeSignIn);

// GrapphQL API
export const api = onRequest({
  timeoutSeconds: 300,
  memory: "1GiB",
}, graphql);

// Jobs
export const jobUpdatePersistenceClubs = onSchedule({
  schedule: "00 08 * * 1",
  region: "europe-west6",
  memory: "1GiB",
  timeoutSeconds: 360,
  timeZone: "Europe/Zurich",
}, updatePersistenceJobClubs);

export const jobUpdatePersistenceTeams = onSchedule({
  schedule: "10 08 * * 1",
  region: "europe-west6",
  memory: "1GiB",
  timeoutSeconds: 540,
  timeZone: "Europe/Zurich",
}, updatePersistenceJobTeams);

export const jobUpdatePersistenceGames = onSchedule({
  schedule: "00 06 * * *",
  region: "europe-west6",
  memory: "512MiB",
  timeoutSeconds: 540,
  timeZone: "Europe/Zurich",
}, updatePersistenceJobGames);

export const jobUpdatePersistenceNews = onSchedule({
  schedule: "30 * * * *",
  region: "europe-west6",
  memory: "512MiB",
  timeoutSeconds: 360,
  timeZone: "Europe/Zurich",
}, updatePersistenceJobNews);

export const jobSyncUnihockeyApp = onSchedule({
  schedule: "30 * * * *",
  region: "europe-west6",
  memory: "512MiB",
  timeoutSeconds: 360,
  timeZone: "Europe/Zurich",
}, syncUnihockeyApp);

export const jobYoutube = onSchedule({
  schedule: "00 08 * * 1",
  region: "europe-west6",
  memory: "512MiB",
  timeoutSeconds: 360,
  timeZone: "Europe/Zurich",
}, exercisesScheduler);

// Reporting
export const jobReportingMember = onSchedule({
  schedule: "00 20 * * 0",
  region: "europe-west6",
  memory: "256MiB",
  timeoutSeconds: 360,
  timeZone: "Europe/Zurich",
}, sendReportingJobMember);

// DB Hooks TEAM > Manage teams currently only available for ADMIN
export const dbDeleteTeam = onDocumentDeleted( {document: "/teams/{teamId}",
  region: "europe-west6",
}, deleteTeam);

export const dbRemoveTeamMember = onDocumentDeleted({
  document: "/teams/{teamId}/members/{userId}",
  region: "europe-west6",
}, deleteTeamMember);

export const dbRemoveTeamAdmin = onDocumentDeleted({
  document: "/teams/{teamId}/admins/{userId}",
  region: "europe-west6",
}, deleteTeamAdmin);

export const dbAddTeamMember = onDocumentCreated({
  document: "/teams/{teamId}/members/{userId}",
  region: "europe-west6",
}, createTeamMember);

export const dbAddTeamAdmin = onDocumentCreated({
  document: "/teams/{teamId}/admins/{userId}",
  region: "europe-west6",
}, createTeamAdmin);

export const dbLeaveTeamAsMember = onDocumentDeleted({
  document: "/userProfile/{userId}/teams/{teamId}",
  region: "europe-west6",
}, leaveTeamAsMember);

// DB Hooks CLUB > Manage club currently only available for ADMIN
export const dbRemoveClubMember = onDocumentDeleted({
  document: "/club/{clubId}/members/{userId}",
  region: "europe-west6",
}, deleteClubMember);

export const dbRemoveClubAdmin = onDocumentDeleted({
  document: "/club/{clubId}/admins/{userId}",
  region: "europe-west6",
}, deleteClubAdmin);

export const dbAddClubMember = onDocumentCreated({
  document: "/club/{clubId}/members/{userId}",
  region: "europe-west6",
}, createClubMember);

export const dbAddClubAdmin = onDocumentCreated({
  document: "/club/{clubId}/admins/{userId}",
  region: "europe-west6",
}, createClubAdmin);

export const dbLeaveClubAsMember = onDocumentDeleted({
  document: "/userProfile/{userId}/clubs/{clubId}",
  region: "europe-west6",
}, leaveClubAsMember);

// DB Hooks STRIPE
export const dbAddCheckoutSession = onDocumentCreated({
  document: "/club/{clubId}/checkout_sessions/{sessionId}",
  region: "europe-west6",
}, createCheckoutSession);

export const dbChangeCheckoutSession = onDocumentUpdated({
  document: "/userProfile/{userId}/checkout_sessions/{sessionId}",
  region: "europe-west6",
}, updateCheckoutSession);

export const dbChangeSubscription = onDocumentUpdated({
  document: "/userProfile/{userId}/subscriptions/{subscriptionId}",
  region: "europe-west6",
}, updateSubscription);

export const dbChangeInvoice = onDocumentUpdated({
  document: "/userProfile/{userId}/subscriptions/{subscriptionId}/invoices/{invoiceId}",
  region: "europe-west6",
}, updateInvoice);

export const dbChangePayment = onDocumentUpdated({
  document: "/userProfile/{userId}/payments/{paymentId}",
  region: "europe-west6",
}, updatePayments);

// DB Hooks REQUESTS
// user perspective: create Request in onboarding
export const dbAddClubRequest = onDocumentCreated({
  document: "/userProfile/{userId}/clubRequests/{clubId}",
  region: "europe-west6",
}, createClubRequest);

export const dbAddTeamRequest = onDocumentCreated({
  document: "/userProfile/{userId}/teamRequests/{teamId}",
  region: "europe-west6",
}, createTeamRequest);

// user perspective: delete Request in profile
export const dbRemoveClubRequest = onDocumentDeleted({
  document: "/userProfile/{userId}/clubRequests/{clubId}",
  region: "europe-west6",
}, deleteClubRequest);

export const dbRemoveTeamRequest = onDocumentDeleted({
  document: "/userProfile/{userId}/teamRequests/{teamId}",
  region: "europe-west6",
}, deleteTeamRequest);

// approve or delete request in team / club management page from admin perspective
export const dbApproveClubRequest = onDocumentUpdated({
  document: "/club/{clubId}/requests/{requestId}",
  region: "europe-west6",
}, approveClubRequest);

export const dbApproveTeamRequest = onDocumentUpdated({
  document: "/teams/{teamId}/requests/{requestId}",
  region: "europe-west6",
}, approveTeamRequest);

// DB Hooks CLUB > TEAMS
export const dbAddClubTeam = onDocumentCreated({
  document: "/club/{clubId}/teams/{teamId}",
  region: "europe-west6",
}, addClubTeam);

// DB Hooks TRAININGS from USER Profile
export const dbAddTeamTraining = onDocumentCreated({
  document: "/userProfile/{userId}/trainings/{trainingId}",
  region: "europe-west6",
}, createTeamTraining);

// DB Hooks EVENTS from USER Profile
// export const dbAddTeamEvent = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamEvent/{eventId}").onCreate(createTeamEvent);
export const dbAddClubEvent = onDocumentCreated({
  document: "/userProfile/{userId}/clubEvents/{eventId}",
  region: "europe-west6",
}, createClubEvent);
export const dbAddHelferEvent = onDocumentCreated({
  document: "/userProfile/{userId}/helferEvents/{eventId}",
  region: "europe-west6",
}, createHelferEvent);

// HELFER EVENTS DB HOOKS
// `club/${clubId}/helferEvents/${eventId}/schichten/${schichtId}/attendees/${userId
export const dbConfirmHelferEvent = onDocumentUpdated({
  document: "/club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}",
  region: "europe-west6",
}, confirmHelferEvent);
export const dbRemoveHelerPunkt = onDocumentDeleted({
  document: "/club/{clubId}/helferPunkte/{helferPunktId}",
  region: "europe-west6",
}, deleteHelferPunkt);


// NOTIFICATION DB HOOKS

// DB Hooks for News Push
export const dbAddClubNewsNotification = onDocumentCreated({
  document: "/club/{clubId}/news/{newsId}",
  region: "europe-west6",
}, createNotificationClubNews);
export const dbAddTeamNewsNotification = onDocumentCreated({
  document: "/teams/{teamId}/news/{newsId}",
  region: "europe-west6",
}, createNotificationTeamNews);
export const dbAddNewsNotification = onDocumentCreated({
  document: "/news/{newsId}",
  region: "europe-west6",
}, createNotificationNews);

// DB Hooks for New Events
export const dbAddClubEventNotification = onDocumentCreated({
  document: "/club/{clubId}/events/{eventId}",
  region: "europe-west6",
}, createNotificationClubEvent);
export const dbAddHelferEventNotification = onDocumentCreated({
  document: "/club/{clubId}/helferEvents/{eventId}",
  region: "europe-west6",
}, createNotificationHelferEvent);
// export const dbAddTeamEventNotification = functions.region("europe-west6").firestore.document("/teams/{teamId}/event/{eventId}").onCreate(createNotificationTeamEvent);

// DB Hooks for Training Push
// export const dbAddTeamTrainingNotification = functions.region("europe-west6").firestore.document("/teams/{teamId}/trainings/{trainingId}").onCreate(createNotificationTeamTraining);
export const dbAddTeamTrainingNotification = onDocumentCreated({
  document: "/userProfile/{userId}/trainings/{trainingId}",
  region: "europe-west6",
}, createNotificationTeamTraining);

// DB HOOKS DELETE TRAINING, EVENTS, HELFEREVENTS
export const dbDeleteTraining = onDocumentDeleted({
  document: "/teams/{teamId}/trainings/{trainingId}",
  region: "europe-west6",
}, deleteTeamTraining);

export const dbDeleteTeamGame = onDocumentDeleted({
  document: "/teams/{teamId}/games/{gameId}",
  region: "europe-west6",
}, deleteTeamGame);

export const dbDeleteClubEvent = onDocumentDeleted({
  document: "/club/{clubId}/events/{eventId}",
  region: "europe-west6",
}, deleteClubEvent);

export const dbDeleteHelferEvent = onDocumentDeleted({
  document: "/club/{clubId}/helferEvents/{eventId}",
  region: "europe-west6",
}, deleteHelferEvent);


// TOTOMAT
// export const totomat = functions.region("europe-west6").https.onRequest(graphql);

// Game Preview
export const gamePreview = onRequest({
  region: "europe-west6",
}, getGamePreview);
