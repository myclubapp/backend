/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export default class firebaseDAO {
    private static _intance: firebaseDAO;
    db: any;
    storage: any;
    auth: any;
    private constructor() {
      // admin.initializeApp();
      admin.initializeApp(functions.config().firebase);
      this.db = admin.firestore();
      this.db.settings({ignoreUndefinedProperties: true});

      this.storage = admin.storage();
      this.auth = admin.auth();
    }

    public static get instance() {
      return this._intance || (this._intance = new this());
    }
}
