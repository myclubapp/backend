
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {logger} from 'firebase-functions';
import firebaseDAO from './../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export const deleteTeamMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('deleteTeamMember > Team Page via Administrator');
  const userId = event.params.userId;
  const teamId = event.params.teamId;
  // logger.info("Auth User > " +  event.auth);
  logger.info('Delete user from team ' + userId, teamId);

  // If removed from team, delete as well team admin
  await db.collection('teams').doc(teamId).collection('admins').doc(userId).delete();
  await db.collection('userProfile').doc(userId).collection('teamAdmins').doc(teamId).delete();

  return db.collection('userProfile').doc(userId).collection('teams').doc(teamId).delete();
  /*
  const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[teamId]) {
    // REMOVE from Team Admin? (incl. claims)

    // SEND EMAIL? --> Your are still part of the organization and need to cancel subscription

    // FINALLY REMOVE FROM CLUB
    return db.collection("userProfile").doc(userId).collection("teams").doc(teamId).delete();
  } else {
    // RESTORE DATA!
    logger.info("Restore DATA");
    return await db.collection("teams").doc(teamId).collection("members").doc(userId).set(
        snapshot.data()
    );
  }*/
};

export const deleteClubMember = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('deleteClubMember > Club Page via Administrator');
  const userId = event.params.userId;
  const clubId = event.params.clubId;
  // logger.info("Auth User > " + context.auth);
  logger.info('Delete user from club ' + userId, clubId);

  // TODO: DELETE FROM ALL TEAMS AS WELL!
  const teamList = await db.collection('club').doc(clubId).collection('teams').get();
  // Delete from all Teams
  try {
    for (const team of teamList.docs) {
      await db.collection('teams').doc(team.id).collection('members').doc(userId).delete();
      await db.collection('userProfile').doc(userId).collection('teams').doc(team.id).delete();

      await db.collection('teams').doc(team.id).collection('admins').doc(userId).delete();
      await db.collection('userProfile').doc(userId).collection('teamAdmins').doc(team.id).delete();
    }
  } catch (e) {
    logger.info('no teams to delete from');
  }
  // Delete as Admin from Club as well.
  await db.collection('club').doc(clubId).collection('admins').doc(userId).delete();
  await db.collection('userProfile').doc(userId).collection('clubAdmins').doc(clubId).delete();

  return db.collection('userProfile').doc(userId).collection('clubs').doc(clubId).delete();
  /*
  const adminUser = await auth.getUser(context.auth?.uid);
  if (adminUser && adminUser.customClaims && adminUser.customClaims[clubId]) {
    // Remove from all Teams
    // TODO

    // REMOVE from Team Admin? (incl. claims)

    // REMOVE from Club Admin (incl. claims)

    // SEND EMAIL? --> Your are still part of the organization and need to cancel subscription

    // FINALLY REMOVE FROM CLUB
    return db.collection("userProfile").doc(userId).collection("club").doc(clubId).delete();
  } else {
    // RESTORE DATA!
    logger.info("Restore DATA");
    return await db.collection("club").doc(clubId).collection("members").doc(userId).set(
        snapshot.data()
    );
  }*/
};
/* export async function deleteMemberFromClub(snapshot: QueryDocumentSnapshot, context: EventContext) {
  logger.info("Delete Member From Club");
  // const userId = context.params.userId;
  // const clubId = context.params.clubId;


  // delete team admin List from team and user
  // const userTeamMember = await db.collection("userProfile").doc(userId).collection("teams").doc(teamId).delete();
  // const teamMemberUser = await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).delete();

  // CODE FROM deleteAdmin.ts
  // delete team admin List from team and user
  // const userTeamAdmin = await db.collection("userProfile").doc(userId).collection("teamAdmin").doc(teamId).delete();
  // const teamAdminUser = await db.collection("teams").doc(teamId).collection("admin").doc(`${userId}`).delete();

  // TODO -> Remove from all Teams /teams/XX/members
  // TODO -> Remove from all Teams Admin /teams/XXX/admins
  // TODO -> Remove from all Clubs -> already done
  // TODO -> Remove from all Clubs Admin /club/clubid/admins

  // TODO -> remove from userProfile of user as well...
} */
// delete club admin List from club and user
// const userClubMember = await db.collection("userProfile").doc(userId).collection("clubs").doc(clubId).delete();
// const clubMemberUser = await db.collection("club").doc(clubId).collection("members").doc(`${userId}`).delete();

// CODE FROM deleteAdmin.ts
// delete club admin List from club and user
// const userClubAdmin = await db.collection("userProfile").doc(userId).collection("clubAdmin").doc(clubId).delete();
// const clubAdminUser = await db.collection("club").doc(clubId).collection("admins").doc(`${userId}`).delete();
/*
  logger.info(`Admin with id ${userId} leaves ClubAdminList ${clubId}`);
  const user = await auth.getUser(userId);
  if (user && user.customClaims && user.customClaims[clubId]) {
    logger.info("remove admin for Club");
    const customClaims = user.customClaims;
    delete customClaims[clubId];
    await auth.setCustomUserClaims(userId, customClaims);
  }
  return true;
  */

