/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
const db = firebaseDAO.instance.db;
const {google} = require("googleapis");
import * as functions from "firebase-functions";

// Initialize the YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: functions.config().api.youtube, // Replace with your API key
});

export async function youtubeScheduler(context: EventContext) {
  try {
    console.log("Youtube Scheduler");
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      maxResults: 100, // Adjust if needed
      playlistId: "PL4GcRGPV7hzzrTUCK_ua0A4rvMc7WmhH9",
    });

    const playlist = response.data.items;
    if (playlist.length === 0) {
      throw new Error("Playlist not found");
    }

    for (const item of playlist) {
      console.log(item);
      console.log("channelId: " + item.snippet.channelId);
      console.log("title: " + item.snippet.title);
      db.collection("exercises").doc("su-" + item.id).set({
        "title": item.snippet.title,
        "description": item.snippet.description,
        "type": "swissunihockey",
        "image": item.snippet.thumbnails.standard.url,
        "date": item.contentDetails.videoPublishedAt,
        "video": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }

    // return playlist[0].snippet.channelId;
    /* console.log("test");

    const clubListRef = await db.collection("clubs").where("active", "==", true).where("type", "==", "swissunihockey").get();
    for (const club of clubListRef.docs) {
      console.log(club.data().externalId);
      const uaClub = await dbUA.collection("clubs").where("suhvClubId", "==", club.data().externalId).get();
      if (uaClub.exists) {
        console.log("found old club with ID: " + uaClub.id);
      }
    } */
  } catch (err) {
    console.error(err);
  }
  return true;
}
