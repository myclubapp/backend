/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export default class firebaseDAO {
    private static _intance: firebaseDAO;
    db: any;
    private constructor() {
      // admin.initializeApp();
      admin.initializeApp(functions.config().firebase);
      this.db = admin.firestore();
    }

    public static get instance() {
      return this._intance || (this._intance = new this());
    }
}