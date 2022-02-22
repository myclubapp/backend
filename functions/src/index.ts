/* eslint-disable max-len */
import * as functions from "firebase-functions";

import {authUserCreate, authUserCreateSendWelcomeMail} from "./auth/user.create";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const graphql = require("./graphql/server");

// Firebase AUTH Welcome User Stuff
export const userCreate = functions.region("europe-west6").auth.user().onCreate(authUserCreate);
export const sendWelcomeMail = functions.region("europe-west6").auth.user().onCreate(authUserCreateSendWelcomeMail);

// GrapphQL API
export const api = functions.runWith({timeoutSeconds: 300}).region("europe-west6").https.onRequest(graphql);

