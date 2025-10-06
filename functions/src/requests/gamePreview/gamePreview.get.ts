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
      // logger.info(documentRef.data());
      const gameData = documentRef.data();
      delete gameData.clubRef;
      delete gameData.resut;
      response.json(gameData);
    } catch (err) {
      logger.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}


export function getGamePreviewClubs(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  corsHandler(request, response, async () => {
    try {
      const documentRef = await db.collection('club').where('active', '==', true).get();
      // logger.info(documentRef.data());
      const clubList = [];
      for (const club of documentRef.docs) {
        clubList.push({
          id: club.id,
          name: club.data().name,
        });
      }
      response.json(clubList);
    } catch (err) {
      logger.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}

export function getGamePreviewClubGames(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });
  const clubId = request.param('clubId');
  logger.info('Club ID: ' + clubId);

  corsHandler(request, response, async () => {
    try {
      const documentRef = await db.collection('club').doc(`${clubId}`).collection('games').get();
      // logger.info(documentRef.data());
      const clubGames = [];
      for (const game of documentRef.docs) {
        clubGames.push({
          id: game.id,
          name: game.data().name,
          result: game.data().result,
          teamHome: game.data().teamHome,
          teamAway: game.data().teamAway,
          time: game.data().time,
          date: game.data().date,
          liga: game.data().liga,
        });
      }
      response.json(clubGames);
    } catch (err) {
      logger.error(err);
      response.status(500).json({
        error: err,
      });
    }
  });
}

