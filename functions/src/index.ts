/* eslint-disable max-len */
import * as functions from "firebase-functions";

import {authUserCreateSendWelcomeEmail} from "./auth/user.create";
// eslint-disable-next-line import/namespace
import {authUserDeleteUserSendByEmail, authUserDeleteUserAccount} from "./auth/user.delete";

import {updatePersistenceJobClubs, updatePersistenceJobTeams} from "./scheduler/syncAssociation.scheduler";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphql = require("./graphql/server");

// Firebase AUTH Welcome User Stuff
// export const userCreate = functions.region("europe-west6").auth.user().onCreate(authUserCreate);
export const sendWelcomeMail = functions.region("europe-west6").auth.user().onCreate(authUserCreateSendWelcomeEmail);
export const sendByeEmail = functions.region("europe-west6").auth.user().onDelete(authUserDeleteUserSendByEmail);
export const deleteUserAccount = functions.region("europe-west6").auth.user().onDelete(authUserDeleteUserAccount);

// GrapphQL API
export const api = functions.runWith({timeoutSeconds: 300, memory: "1GB"}).region("europe-west6").https.onRequest(graphql);

// Jobs
export const jobUpdatePersistenceClubs = functions.runWith({timeoutSeconds: 360, memory: "1GB"}).region("europe-west6").pubsub.schedule("00 08 * * 1").timeZone("Europe/Zurich").onRun(updatePersistenceJobClubs); // monday 8:00
export const jobUpdatePersistenceTeams = functions.runWith({timeoutSeconds: 540, memory: "1GB"}).region("europe-west6").pubsub.schedule("00 09 * * 1").timeZone("Europe/Zurich").onRun(updatePersistenceJobTeams); // monday 9:00
