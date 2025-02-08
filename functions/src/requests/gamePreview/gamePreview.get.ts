/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from 'firebase-functions/v1';
import firebaseDAO from '../../firebaseSingleton';

import cors from 'cors';

const db = firebaseDAO.instance.db;

export function getGamePreview(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  const gameId = request.param('gameId');
  const clubId = request.param('clubId');
  console.log('Game ID: ' + gameId);
  console.log('Club ID: ' + clubId);

  corsHandler(request, response, async () => {
    try {
      const documentRef = await db.collection('club').doc(`${clubId}`).collection('games').doc(`${gameId}`).get();
      console.log(documentRef.data());
      response.json(documentRef.data());
    } catch (err) {
      console.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}
