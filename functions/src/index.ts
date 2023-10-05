/* eslint-disable linebreak-style */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import {authUserBlockBeforeCreate, authUserBlockBeforeSignIn} from "./auth/user.block";

import {authUserCreateSendWelcomeEmail, authUserCreateAdminUser} from "./auth/user.create";
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

import {createTeamTraining} from "./firestore/training/createTeamTraining";

import {createNotificationTeamEvent, createTeamEvent} from "./firestore/event/createTeamEvent";
import {createClubEvent, createNotificationClubEvent} from "./firestore/event/createClubEvent";

import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from "./scheduler/syncAssociation.scheduler";
import {syncUnihockeyApp} from "./scheduler/syncUnihockeyApp";

import {sendReportingJobMember} from "./reporting/member.scheduler";

import {createNotificationClubNews} from "./firestore/news/createClubNews";
import {createNotificationTeamNews} from "./firestore/news/createTeamNews";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphql = require("./graphql/server");

// Firebase AUTH Welcome User Stuff

export const sendWelcomeMail = functions.region("europe-west6").auth.user().onCreate(authUserCreateSendWelcomeEmail);
export const onCreateUserCreateAdminUser = functions.region("europe-west6").auth.user().onCreate(authUserCreateAdminUser);
export const sendByeEmail = functions.region("europe-west6").auth.user().onDelete(authUserDeleteUserSendByEmail);
export const deleteUserAccount = functions.region("europe-west6").auth.user().onDelete(authUserDeleteUserAccount);

// NEW AUTH BLOCK FUNCTIONS
export const beforeCreate = functions.region("europe-west6").auth.user().beforeCreate(authUserBlockBeforeCreate);
export const beforeSignIn = functions.region("europe-west6").auth.user().beforeSignIn(authUserBlockBeforeSignIn);

// GrapphQL API
export const api = functions.runWith({timeoutSeconds: 300, memory: "1GB"}).region("europe-west6").https.onRequest(graphql);

// Jobs
export const jobUpdatePersistenceClubs = functions.runWith({timeoutSeconds: 360, memory: "1GB"}).region("europe-west6").pubsub.schedule("00 08 * * 1").timeZone("Europe/Zurich").onRun(updatePersistenceJobClubs); // monday 8:00
export const jobUpdatePersistenceTeams = functions.runWith({timeoutSeconds: 540, memory: "1GB"}).region("europe-west6").pubsub.schedule("10 08 * * 1").timeZone("Europe/Zurich").onRun(updatePersistenceJobTeams); // monday 8:10
export const jobUpdatePersistenceGames = functions.runWith({timeoutSeconds: 540, memory: "512MB"}).region("europe-west6").pubsub.schedule("00 06 * * *").timeZone("Europe/Zurich").onRun(updatePersistenceJobGames); // daily 06:00
export const jobUpdatePersistenceNews = functions.runWith({timeoutSeconds: 360, memory: "512MB"}).region("europe-west6").pubsub.schedule("30 * * * *").timeZone("Europe/Zurich").onRun(updatePersistenceJobNews); // daily every 30 minutes
export const jobSyncUnihockeyApp = functions.runWith({timeoutSeconds: 360, memory: "512MB"}).region("europe-west6").pubsub.schedule("30 * * * *").timeZone("Europe/Zurich").onRun(syncUnihockeyApp); // daily every 30 minutes

// Reporting
export const jobReportingMember = functions.runWith({timeoutSeconds: 360, memory: "256MB"}).region("europe-west6").pubsub.schedule("00 20 * * 0").timeZone("Europe/Zurich").onRun(sendReportingJobMember); // sunday 20:00

// DB Hooks TEAM > Manage teams currently only available for ADMIN
export const dbRemoveTeamMember = functions.region("europe-west6").firestore.document("/teams/{teamId}/members/{userId}").onDelete(deleteTeamMember);
export const dbRemoveTeamAdmin = functions.region("europe-west6").firestore.document("/teams/{teamId}/admins/{userId}").onDelete(deleteTeamAdmin);
export const dbAddTeamMember = functions.region("europe-west6").firestore.document("/teams/{teamId}/members/{userId}").onCreate(createTeamMember);
export const dbAddTeamAdmin = functions.region("europe-west6").firestore.document("/teams/{teamId}/admins/{userId}").onCreate(createTeamAdmin);

// DB Hooks CLUB
export const dbRemoveClubMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubs/{clubId}").onDelete(deleteClubMember);
export const dbRemoveClubAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubAdmin/{clubId}").onDelete(deleteClubAdmin);
export const dbAddClubMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubs/{clubId}").onCreate(createClubMember); // Not needed?
export const dbAddClubAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubAdmin/{clubId}").onCreate(createClubAdmin);

// export const dbRemoveMemberFromClub = functions.region("europe-west6").firestore.document("/club/{clubId}/members/{userId}").onDelete(deleteMemberFromClub);
// export const dbRemoveMemberFromTeam = functions.region("europe-west6").firestore.document("/teams/{teamId}/members/{userId}").onDelete(deleteMemberFromTeam);

// DB Hooks REQUESTS
// user perspective: create Request in onboarding
export const dbAddClubRequest = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubRequests/{clubId}").onCreate(createClubRequest);
export const dbAddTeamRequest = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamRequests/{teamId}").onCreate(createTeamRequest);

// user perspective: delete Request in profile
export const dbRemoveClubRequest = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubRequests/{clubId}").onDelete(deleteClubRequest);
export const dbRemoveTeamRequest = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamRequests/{teamId}").onDelete(deleteTeamRequest);

// approve or delete request in team / club management page from admin perspective
export const dbApproveClubRequest = functions.region("europe-west6").firestore.document("/club/{clubId}/requests/{requestId}").onUpdate(approveClubRequest);
export const dbApproveTeamRequest = functions.region("europe-west6").firestore.document("/teams/{teamId}/requests/{requestId}").onUpdate(approveTeamRequest);


// DB Hooks TRAININGS
export const dbAddTeamTraining = functions.region("europe-west6").firestore.document("/userProfile/{userId}/trainings/{trainingId}").onCreate(createTeamTraining);

// DB Hooks EVENTS
export const dbAddTeamEvent = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamEvent/{eventId}").onCreate(createTeamEvent);
export const dbAddClubEvent = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubEvent/{eventId}").onCreate(createClubEvent);

// NOTIFICATION DB HOOKS

// DB Hooks for News Push
export const dbAddClubNewsNotification = functions.region("europe-west6").firestore.document("/club/{clubId}/news/{newsId}").onCreate(createNotificationClubNews);
export const dbAddTeamNewsNotification = functions.region("europe-west6").firestore.document("/teams/{teamId}/news/{newsId}").onCreate(createNotificationTeamNews);

// DB Hooks for New Events
export const dbAddClubEventNotification = functions.region("europe-west6").firestore.document("/club/{clubId}/event/{eventId}").onCreate(createNotificationClubEvent);
export const dbAddTeamEventNotification = functions.region("europe-west6").firestore.document("/teams/{teamId}/event/{eventId}").onCreate(createNotificationTeamEvent);

