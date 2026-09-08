/* eslint-disable @typescript-eslint/no-explicit-any */

import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {getAuth} from 'firebase-admin/auth';
import {getMessaging} from 'firebase-admin/messaging';

// const serviceAccount = require("path/to/serviceAccountKey.json");

export default class firebaseDAO {
  private static _intance: firebaseDAO;
  db: any;
  // dbUA: any;
  storage: any;
  auth: any;
  messaging: any;
  private constructor() {
    initializeApp(); // Default

    this.db = getFirestore();
    this.db.settings({ignoreUndefinedProperties: true});
    this.storage = getStorage();
    this.auth = getAuth();
    this.messaging = getMessaging();

    /* const unihockeyApp = initializeApp({
        credential: cert(serviceAccount), // cert aus 'firebase-admin/app'
        databaseURL: "https://unihockeyclub.firebaseio.com",
      }, "UnihockeyApp");
      this.dbUA = getDatabase(unihockeyApp); // aus 'firebase-admin/database' */
  }

  public static get instance() {
    return this._intance || (this._intance = new this());
  }
}
