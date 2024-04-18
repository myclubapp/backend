/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";

import * as cors from "cors";

const db = firebaseDAO.instance.db;

export function getGamePreview(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  const gameId = request.params["gameId"];
  const clubId = request.params["clubId"];
  console.log("Game ID: " + gameId);
  console.log("Club ID: " + clubId);

  corsHandler(request, response, async () => {
    try {
      const documentRef = await db.collection("club").doc(`${clubId}`).collection("games").doc(`${gameId}`).get();
      console.log(documentRef.data());
    } catch (err) {
      console.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}
