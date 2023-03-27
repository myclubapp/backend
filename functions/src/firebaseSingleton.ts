/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const serviceAccount = require("path/to/serviceAccountKey.json");

export default class firebaseDAO {
    private static _intance: firebaseDAO;
    db: any;
    dbUA: any;
    storage: any;
    auth: any;
    messaging: any;
    private constructor() {
      // admin.initializeApp();
      admin.initializeApp(functions.config().firebase); // Default

      this.db = admin.firestore();
      this.db.settings({ignoreUndefinedProperties: true});
      this.storage = admin.storage();
      this.auth = admin.auth();
      this.messaging = admin.messaging();

      /* const unihockeyApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://unihockeyclub.firebaseio.com",
      }, "UnihockeyApp");
      this.dbUA = unihockeyApp.database(); */
    }

    public static get instance() {
      return this._intance || (this._intance = new this());
    }
}
