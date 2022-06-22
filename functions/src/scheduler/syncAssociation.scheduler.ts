/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";

import {updateTeamsSwissunihockey, updateClubsSwissunihockey, updateGamesSwissunihockey} from "./utils/update.swissunihockey";
// import {updateTeamsSwissvolleyball, updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
import {updateTeamsSwisshandball, updateClubsSwisshandball} from "./utils/update.swisshandball";
import {updateTeamsSwissturnverband, updateClubsSwissturnverband} from "./utils/update.swissturnverband";


export async function updatePersistenceJobClubs(context: EventContext) {
  try {
    await updateClubsSwissunihockey();
    // await updateClubsSwissvolleyball();
    await updateClubsSwisshandball();
    await updateClubsSwissturnverband();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobTeams(context: EventContext) {
  try {
    await updateTeamsSwissunihockey();
    // await updateTeamsSwissvolleyball();
    await updateTeamsSwisshandball();
    await updateTeamsSwissturnverband();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobGames(context: EventContext) {
  try {
    await updateGamesSwissunihockey();
  } catch (err) {
    console.error(err);
  }
}

/*
async function updateSwissunihockey() {
  await updateClubsSwissunihockey();
  // await updateTeamsSwissunihockey();
}

async function updateSwissVolleyball() {
  await updateClubsSwissvolleyball();
  // await updateTeamsSwissvolleyball();
}


async function updateSwissHandball() {
  await updateClubsSwisshandball();
  // await updateTeamsSwisshandball();
}


async function updateSwissTurnverband() {
  await updateClubsSwissturnverband();
  // await updateTeamsSwissturnverband();
}
*/
