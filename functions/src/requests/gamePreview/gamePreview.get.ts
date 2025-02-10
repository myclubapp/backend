/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from 'firebase-functions/v1';
import firebaseDAO from '../../firebaseSingleton.js';
import {logger} from 'firebase-functions';
import cors from 'cors';

const db = firebaseDAO.instance.db;

export function getGamePreview(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  const gameId = request.param('gameId');
  const clubId = request.param('clubId');
  logger.info('Game ID: ' + gameId);
  logger.info('Club ID: ' + clubId);

  corsHandler(request, response, async () => {
    try {
      const documentRef = await db.collection('club').doc(`${clubId}`).collection('games').doc(`${gameId}`).get();
      logger.info(documentRef.data());
      response.json(documentRef.data());
    } catch (err) {
      logger.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}
