/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;

// import resolversST from "./../../graphql/swissturnverband/resolvers";

const jsdom = require("jsdom");
import {html} from "./../../graphql/swissturnverband/stv-vereine.finder.html";

export async function updateTeamsSwissturnverband(): Promise<any> {
  console.log("no need to update turnverband");
}

export async function updateClubsSwissturnverband(): Promise<any> {
  console.log("Update Clubs SwissTurnverband");

  // const clubData = await resolversST.SwissTurnverband.clubs();
  const clubData = await getClubs();
  for (const club of clubData) {
    console.log(club.name);
    await db.collection("club").doc(`st-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: "swissturnverband",
      updated: new Date(),
    }, {
      merge: true,
    });


    // address
    for (const address of club.address) {
      address.externalId = address.id;
      address.type = "swissturnverband";
      address.updated = new Date();
      await db.collection("club").doc(`st-${club.id}`).collection("contacts").doc(`st-${address.id}`).set(address, {
        merge: true,
      });
    }
    // teams
    const fbClubData = await db.collection("club").doc(`st-${club.id}`).get();
    if (fbClubData.exists && fbClubData.data().active) {
      for (const team of club.teams) {
        team.externalId = team.id;
        team.type = "swissturnverband";
        team.updated = new Date();
        team.clubRef = db.collection("club").doc(`st-${club.id}`),
        await db.collection("teams").doc(`st-${team.id}`).set(team, {
          merge: true,
        });
        await db.collection("club").doc(`st-${club.id}`).collection("teams").doc(`st-${team.id}`).set({
          teamRef: db.collection("teams").doc(`st-${team.id}`),
        });
      }
    } else {
      console.log(`${club.name} is not active`);
    }
  }
}

async function getClubs() {
  try {
    const dom = new jsdom.JSDOM(html);
    const clubList = < any > [];
    const domList: NodeList = dom.window.document.querySelectorAll(".tx-stv-clubfinder-result");
    // console.log("NodeList Entries: " + domList.length);
    let clubId = 0;
    domList.forEach((clubListNode: Node, key:number, parent: NodeList) => { // here we have the clubs
      // const clubData: NodeList = domList[0].childNodes;
      const clubData: NodeList = clubListNode.childNodes;
      clubData.forEach((clubNode, key:number, parent: NodeList) => { // just one entry..
        // console.log(">> NEW CLUB");
        if (clubNode.hasChildNodes()) {
          const nodes = clubNode.childNodes;
          if (nodes[0].hasChildNodes()) {
            // const contactNodeList = nodes[0].childNodes; // Index 0 -> Contact Eintrag
            const contactNode = nodes[0].childNodes[0]; // hat hier nur 1 Eintrag
            const clubNameNode = contactNode.childNodes[0];
            const clubAddressNode = contactNode.childNodes[1];

            // GET CONTACT DATA
            let address = {};
            if (contactNode.hasChildNodes()) {
              let website= "";
              try {
                website = clubNameNode.childNodes[3].textContent || "";
              } catch (e) {
                // console.log("no website");
              }

              let email = "";
              try {
                email = clubAddressNode.childNodes[3].textContent || "";
              } catch (e) {
                // console.log("no email");
              }

              address = {
                id: clubId,
                firstName: clubAddressNode.childNodes[1].textContent,
                lastName: clubAddressNode.childNodes[1].textContent,
                street: "",
                number: "",
                postalcode: clubNameNode.childNodes[1].textContent,
                city: clubNameNode.childNodes[1].textContent,
                email: email,
                phone: clubAddressNode.childNodes[2].textContent,
                website: website,
              };
            }
            const angebotNode = nodes[1].childNodes[0]; // hat hier nur 1 Eintrag
            let teamId = 0;
            const teamList = < any > [];
            for (let i = 0, l = angebotNode.childNodes.length; i < l; ++i) {
              const angebot: Node = angebotNode.childNodes[i];

              console.log("> " + angebot.childNodes[0].childNodes[0].textContent);

              let trainingInfo = "";
              try {
                trainingInfo = angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].textContent || "";
                // console.log(">> Tag: " + trainingInfo);
              } catch (e) {
                // console.log(">> Tag: --- ");
              }

              let info = "";
              try {
                info = angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[1].textContent || "";
                // console.log(">>  JB: " + info);
              } catch (e) {
                // console.log(">>  JB: kein JB");
              }

              if (angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].hasChildNodes() &&
              angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes.length > 1 ) {
                // console.log(trainingInfo);
                // console.log(info);
              }
              if (angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].hasChildNodes() &&
              angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes.length == 1 ) {
                // console.log(trainingInfo);
              }
              if (!angebot.childNodes[1].childNodes[0].childNodes[0].childNodes[0].hasChildNodes() ) {
                // console.log("Keine Details");
              }

              if (trainingInfo.toString().startsWith("Jahresbeitrag")) {
                info = trainingInfo;
                trainingInfo = "";
              }

              try {
                teamList.push({
                  id: clubId + "-" + teamId,
                  name: angebot.childNodes[0].childNodes[0].textContent,
                  trainingInfo: trainingInfo,
                  info: info,
                });
              } catch (e) {
                console.log("error with team: ");
              }
              teamId++;
            }
            try {
              clubList.push({
                id: clubId,
                name: clubNameNode.childNodes[0].textContent,
                address: [address],
                teams: teamList,
              });
            } catch (e) {
              console.log("error with club: " + clubNameNode.childNodes[0].textContent);
            }
            clubId++;
          }
        }
        // console.log(clubNode.nodeType); ELEMENT_NODE
      });
    });
    return clubList;
  } catch (e) {
    console.log(e);
    return;
  }
}
