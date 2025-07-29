/* eslint-disable max-len */
// ==================== IMPORTS ====================

// Auth-bezogene Imports
import {authUserDeleteUserSendByEmail, authUserDeleteUserAccount} from './auth/user.delete.js';
import {createUserSendWelcomeEmail} from './auth/user.create.js';

// Club-bezogene Imports
import {createClubAdmin, createTeamAdmin} from './firestore/createAdmin.js';
import {createClubMember, createTeamMember} from './firestore/createMember.js';
import {deleteClubAdmin, deleteTeamAdmin} from './firestore/deleteAdmin.js';
import {deleteClubMember, deleteClubParent, deleteTeamMember} from './firestore/deleteMember.js';
import {addClubTeam} from './firestore/club/createClubTeam.js';
import {createCheckoutSession, updateCheckoutSession, updateInvoice, updatePayments, updateSubscription} from './firestore/club/stripeCheckout.js';

// Request-bezogene Imports
import {createClubRequest} from './firestore/request/createClubRequest.js';
import {createTeamRequest} from './firestore/request/createTeamRequest.js';
import {deleteClubRequest} from './firestore/request/deleteClubRequest.js';
import {deleteTeamRequest} from './firestore/request/deleteTeamRequest.js';
import {approveClubRequest} from './firestore/request/approveClubRequest.js';
import {approveTeamRequest} from './firestore/request/approveTeamRequest.js';

// Training-bezogene Imports
import {createNotificationTeamTraining, createTeamTraining} from './firestore/training/createTeamTraining.js';
import {deleteTeamTraining} from './firestore/training/deleteTeamTraining.js';
import {changeTeamTraining} from './firestore/training/changeTeamTraining.js';

// Event-bezogene Imports
import {createHelferEvent, createNotificationHelferEvent} from './firestore/event/createHelferEvent.js';
import {createClubEvent, createNotificationClubEvent} from './firestore/event/createClubEvent.js';
import {confirmHelferEvent} from './firestore/event/confirmHelferEvent.js';
import {deleteClubEvent} from './firestore/event/deleteClubEvent.js';
import {addMemberToHelferEvent, changeStatusMemberHelferEvent} from './firestore/event/addMemberToHelferEvent.js';
import {addMemberToEvent, changeStatusMemberEvent} from './firestore/event/addMemberToEvent.js';
import {deleteHelferEvent} from './firestore/event/deleteHelferEvent.js';
import {deleteHelferPunkt} from './firestore/event/deleteHelferPunkt.js';
import {changeClubEvent} from './firestore/event/changeClubEvent.js';

// News-bezogene Imports
import {createNotificationClubNews} from './firestore/news/createClubNews.js';
import {createNotificationTeamNews} from './firestore/news/createTeamNews.js';
import {createNotificationNews} from './firestore/news/createNews.js';

// Scheduler-bezogene Imports
import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from './scheduler/syncAssociation.scheduler.js';
import {exercisesScheduler} from './scheduler/exercise.scheduler.js';

// Game-bezogene Imports
import {getGamePreview} from './requests/gamePreview/gamePreview.get.js';
import {deleteTeamGame} from './firestore/game/deleteTeamGame.js';

// Team-bezogene Imports
import {deleteTeam} from './firestore/team/deleteTeam.js';

// Member-bezogene Imports
import {leaveClubAsMember, leaveTeamAsMember} from './firestore/userProfile/leaveAsMember.js';
import {removeChildFromParent} from './firestore/userProfile/removeChildFromParent.js';
// Kids-bezogene Imports
import {createKid, verifyKidsEmailService} from './firestore/userProfile/kidsRequest.js';

// GraphQL Import
import graphqlServer from './graphql/server.js';

// Firebase Imports
import {onDocumentUpdated, onDocumentDeleted, onDocumentCreated, onDocumentWritten} from 'firebase-functions/v2/firestore';
import * as functions from 'firebase-functions/v1';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {onRequest} from 'firebase-functions/v2/https';
import {changeClubMemberInvoice} from './firestore/invoice/changeInvoice.js';


// ==================== AUTH FUNCTIONS ====================
export const sendByeEmail = functions.region('europe-west6').auth.user().onDelete(authUserDeleteUserSendByEmail);
export const deleteUserAccount = functions.region('europe-west6').auth.user().onDelete(authUserDeleteUserAccount);
export const dbCreateUserSendWelcomeEmail = onDocumentCreated({
  document: '/userProfile/{userId}',
  region: 'europe-west6',
}, createUserSendWelcomeEmail);

// ==================== CLUB FUNCTIONS ====================
export const dbRemoveClubMember = onDocumentDeleted({
  document: '/club/{clubId}/members/{userId}',
  region: 'europe-west6',
}, deleteClubMember);

export const dbRemoveClubParent = onDocumentDeleted({
  document: '/club/{clubId}/parents/{userId}',
  region: 'europe-west6',
}, deleteClubParent);

export const dbRemoveClubAdmin = onDocumentDeleted({
  document: '/club/{clubId}/admins/{userId}',
  region: 'europe-west6',
}, deleteClubAdmin);

export const dbAddClubMember = onDocumentCreated({
  document: '/club/{clubId}/members/{userId}',
  region: 'europe-west6',
}, createClubMember);

export const dbAddClubAdmin = onDocumentCreated({
  document: '/club/{clubId}/admins/{userId}',
  region: 'europe-west6',
}, createClubAdmin);

export const dbAddClubTeam = onDocumentCreated({
  document: '/club/{clubId}/teams/{teamId}',
  region: 'europe-west6',
}, addClubTeam);

export const dbChangeClubMemberInvoice = onDocumentUpdated({
  document: '/club/{clubId}/invoicePeriods/{periodId}/invoices/{invoiceId}',
  region: 'europe-west6',
}, changeClubMemberInvoice);

// ==================== TEAM FUNCTIONS ====================
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

export const dbAddTeamMember = onDocumentCreated({
  document: '/teams/{teamId}/members/{userId}',
  region: 'europe-west6',
}, createTeamMember);

export const dbAddTeamAdmin = onDocumentCreated({
  document: '/teams/{teamId}/admins/{userId}',
  region: 'europe-west6',
}, createTeamAdmin);

// ==================== MEMBER FUNCTIONS ====================
export const dbLeaveTeamAsMember = onDocumentDeleted({
  document: '/userProfile/{userId}/teams/{teamId}',
  region: 'europe-west6',
}, leaveTeamAsMember);

export const dbLeaveClubAsMember = onDocumentDeleted({
  document: '/userProfile/{userId}/clubs/{clubId}',
  region: 'europe-west6',
}, leaveClubAsMember);

export const dbRemoveKid = onDocumentDeleted({
  document: '/userProfile/{parentId}/children/{childId}',
  region: 'europe-west6',
}, removeChildFromParent);

// ==================== STRIPE FUNCTIONS ====================
export const dbAddCheckoutSession = onDocumentCreated({
  document: '/club/{clubId}/checkout_sessions/{sessionId}',
  region: 'europe-west6',
}, createCheckoutSession);

export const dbChangeCheckoutSession = onDocumentUpdated({
  document: '/userProfile/{userId}/checkout_sessions/{sessionId}',
  region: 'europe-west6',
}, updateCheckoutSession);

export const dbChangeSubscription = onDocumentWritten({
  document: '/userProfile/{userId}/subscriptions/{subscriptionId}',
  region: 'europe-west6',
}, updateSubscription);

export const dbChangeInvoice = onDocumentWritten({
  document: '/userProfile/{userId}/subscriptions/{subscriptionId}/invoices/{invoiceId}',
  region: 'europe-west6',
}, updateInvoice);

export const dbChangePayment = onDocumentWritten({
  document: '/userProfile/{userId}/payments/{paymentId}',
  region: 'europe-west6',
}, updatePayments);

// ==================== KIDS FUNCTIONS ====================
export const dbAddKid = onDocumentCreated({
  document: '/userProfile/{userId}/kidsRequests/{requestId}',
  region: 'europe-west6',
}, createKid);

// ==================== REQUEST FUNCTIONS ====================
export const dbAddClubRequest = onDocumentCreated({
  document: '/userProfile/{userId}/clubRequests/{clubId}',
  region: 'europe-west6',
}, createClubRequest);

export const dbAddTeamRequest = onDocumentCreated({
  document: '/userProfile/{userId}/teamRequests/{teamId}',
  region: 'europe-west6',
}, createTeamRequest);

export const dbRemoveClubRequest = onDocumentDeleted({
  document: '/userProfile/{userId}/clubRequests/{clubId}',
  region: 'europe-west6',
}, deleteClubRequest);

export const dbRemoveTeamRequest = onDocumentDeleted({
  document: '/userProfile/{userId}/teamRequests/{teamId}',
  region: 'europe-west6',
}, deleteTeamRequest);

export const dbApproveClubRequest = onDocumentUpdated({
  document: '/club/{clubId}/requests/{requestId}',
  region: 'europe-west6',
}, approveClubRequest);

export const dbApproveTeamRequest = onDocumentUpdated({
  document: '/teams/{teamId}/requests/{requestId}',
  region: 'europe-west6',
}, approveTeamRequest);

// ==================== TRAINING FUNCTIONS ====================
export const dbAddTeamTraining = onDocumentCreated({
  document: '/userProfile/{userId}/trainings/{trainingId}',
  region: 'europe-west6',
}, createTeamTraining);

export const dbChangeTeamTraining = onDocumentUpdated({
  document: '/teams/{teamId}/trainings/{trainingId}',
  region: 'europe-west6',
}, changeTeamTraining);

export const dbDeleteTraining = onDocumentDeleted({
  document: '/teams/{teamId}/trainings/{trainingId}',
  region: 'europe-west6',
}, deleteTeamTraining);

export const dbAddTeamTrainingNotification = onDocumentCreated({
  document: '/userProfile/{userId}/trainings/{trainingId}',
  region: 'europe-west6',
}, createNotificationTeamTraining);

// ==================== EVENT FUNCTIONS ====================
export const dbAddClubEvent = onDocumentCreated({
  document: '/userProfile/{userId}/clubEvents/{eventId}',
  region: 'europe-west6',
}, createClubEvent);

export const dbAddHelferEvent = onDocumentCreated({
  document: '/userProfile/{userId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, createHelferEvent);

export const dbAddClubEventNotification = onDocumentCreated({
  document: '/club/{clubId}/events/{eventId}',
  region: 'europe-west6',
}, createNotificationClubEvent);

export const dbAddHelferEventNotification = onDocumentCreated({
  document: '/club/{clubId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, createNotificationHelferEvent);

export const dbConfirmHelferEvent = onDocumentUpdated({
  document: '/club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}',
  region: 'europe-west6',
}, confirmHelferEvent);

export const dbRemoveHelerPunkt = onDocumentDeleted({
  document: '/club/{clubId}/helferPunkte/{helferPunktId}',
  region: 'europe-west6',
}, deleteHelferPunkt);

export const dbDeleteClubEvent = onDocumentDeleted({
  document: '/club/{clubId}/events/{eventId}',
  region: 'europe-west6',
}, deleteClubEvent);

export const dbChangeClubEvent = onDocumentUpdated({
  document: '/club/{clubId}/events/{eventId}',
  region: 'europe-west6',
}, changeClubEvent);

export const dbDeleteHelferEvent = onDocumentDeleted({
  document: '/club/{clubId}/helferEvents/{eventId}',
  region: 'europe-west6',
}, deleteHelferEvent);

export const dbAddMemberToHelferEvent = onDocumentCreated({
  document: '/club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}',
  region: 'europe-west6',
}, addMemberToHelferEvent);

export const dbChangeStatusMemberToHelferEvent = onDocumentUpdated({
  document: '/club/{clubId}/helferEvents/{eventId}/schichten/{schichtId}/attendees/{userId}',
  region: 'europe-west6',
}, changeStatusMemberHelferEvent);

export const dbAddMemberToEvent = onDocumentCreated({
  document: '/club/{clubId}/events/{eventId}/attendees/{userId}',
  region: 'europe-west6',
}, addMemberToEvent);

export const dbChangeStatusMemberToEvent = onDocumentUpdated({
  document: '/club/{clubId}/events/{eventId}/attendees/{userId}',
  region: 'europe-west6',
}, changeStatusMemberEvent);

// ==================== NEWS FUNCTIONS ====================
export const dbAddClubNewsNotification = onDocumentCreated({
  document: '/club/{clubId}/news/{newsId}',
  region: 'europe-west6',
}, createNotificationClubNews);

export const dbAddTeamNewsNotification = onDocumentCreated({
  document: '/teams/{teamId}/news/{newsId}',
  region: 'europe-west6',
}, createNotificationTeamNews);

export const dbAddNewsNotification = onDocumentCreated({
  document: '/news/{newsId}',
  region: 'europe-west6',
}, createNotificationNews);

// ==================== GAME FUNCTIONS ====================
export const dbDeleteTeamGame = onDocumentDeleted({
  document: '/teams/{teamId}/games/{gameId}',
  region: 'europe-west6',
}, deleteTeamGame);

// ==================== SCHEDULER JOBS ====================
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

export const jobYoutube = onSchedule({
  schedule: '00 08 1 * *',
  region: 'europe-west6',
  memory: '512MiB',
  timeoutSeconds: 360,
  timeZone: 'Europe/Zurich',
}, exercisesScheduler);

// ==================== HTTP ENDPOINTS ====================
export const verifyKidsEmail = onRequest({
  region: 'europe-west6',
  memory: '256MiB',
  timeoutSeconds: 360,
}, verifyKidsEmailService);

export const api = onRequest({
  region: 'europe-west6',
  timeoutSeconds: 300,
  memory: '1GiB',
}, graphqlServer);

export const totomat = onRequest({
  region: 'europe-west6',
  memory: '1GiB',
}, graphqlServer);

export const gamePreview = onRequest({
  region: 'europe-west6',
}, getGamePreview);
