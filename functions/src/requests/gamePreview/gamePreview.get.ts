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

  const gameId = request.param("gameId");
  console.log("Game ID: " + gameId);

  corsHandler(request, response, async () => {
    try {
      const querySnapshot = await db.collection("club").collectionGroup("games").where("externalId", "==", gameId).get();
      querySnapshot.forEach((doc:any) => {
        console.log(doc.id, " => ", doc.data());
      });
    } catch (err) {
      console.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}
