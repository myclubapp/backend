import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";

import * as cors from 'cors';

const db = firebaseDAO.instance.db;

export function getGamePreview(request: functions.Request, response: functions.Response<any>) {
    const corsHandler = cors({
        origin: true,
    });

    const gameId = request.param("gameId");
    console.log("Game ID: " + gameId);

    corsHandler(request, response, async () => {
        try {
            let querySnapshot = await db.collection("club").collectionGroup('games').where('externalId', '==', gameId).get();
            querySnapshot.forEach((doc:any) => {
                console.log(doc.id, ' => ', doc.data());
            });

        } catch (err) {
            response.status(500).json({
                error: err,
            });
        }
    });
}