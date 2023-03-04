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

import {updatePersistenceJobClubs, updatePersistenceJobTeams, updatePersistenceJobGames, updatePersistenceJobNews} from "./scheduler/syncAssociation.scheduler";

import {sendReportingJobMember} from "./reporting/member.scheduler";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphql = require("./graphql/server");

// Firebase AUTH Welcome User Stuff
// export const userCreate = functions.region("europe-west6").auth.user().onCreate(authUserCreate);
export const sendWelcomeMail = functions.region("europe-west6").auth.user().onCreate(authUserCreateSendWelcomeEmail);
export const onCreateUsercreateAdminUser = functions.region("europe-west6").auth.user().onCreate(authUserCreateAdminUser);
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
export const jobUpdatePersistenceGames = functions.runWith({timeoutSeconds: 360, memory: "512MB"}).region("europe-west6").pubsub.schedule("00 06 * * *").timeZone("Europe/Zurich").onRun(updatePersistenceJobGames); // daily 06:00
export const jobUpdatePersistenceNews = functions.runWith({timeoutSeconds: 360, memory: "512MB"}).region("europe-west6").pubsub.schedule("30 * * * *").timeZone("Europe/Zurich").onRun(updatePersistenceJobNews); // daily every 30 minutes

// Reporting
export const jobReportingMember = functions.runWith({timeoutSeconds: 360, memory: "256MB"}).region("europe-west6").pubsub.schedule("00 20 * * 0").timeZone("Europe/Zurich").onRun(sendReportingJobMember); // sunday 20:00

// DB Hooks TEAM
export const dbRemoveTeamMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teams/{teamId}").onDelete(deleteTeamMember);
export const dbRemoveTeamAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamAdmin/{teamId}").onDelete(deleteTeamAdmin);
export const dbAddTeamMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teams/{teamId}").onCreate(createTeamMember);
export const dbAddTeamAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/teamAdmin/{teamId}").onCreate(createTeamAdmin);

// DB Hooks CLUB
export const dbRemoveClubMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubs/{clubId}").onDelete(deleteClubMember);
export const dbRemoveClubAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubAdmin/{clubId}").onDelete(deleteClubAdmin);
export const dbAddClubMember = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubs/{clubId}").onCreate(createClubMember);
export const dbAddClubAdmin = functions.region("europe-west6").firestore.document("/userProfile/{userId}/clubAdmin/{clubId}").onCreate(createClubAdmin);
