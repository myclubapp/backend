/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const {convert} = require("html-to-text");
const jsdom = require("jsdom");

// const fs = require("fs");
// const path = require("path");
import {html} from "./stv-vereine.finder.html";

// const {JSDOM} = jsdom;

export default {

  Club: {
    teams(parent: any, args: any, context: any, info: any) {
      return getTeams(parent.id);
    },
    games(parent: any, args: any, context: any, info: any) {
      return getClubGames(parent.id);
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      return getGames(parent.id);
    },
    rankings(parent: any, args: any, context: any, info: any) {
      return getRankings(parent.id);
    },
    details(parent: any, args: any, context: any, info: any) {
      return getTeam(parent.id);
    },
  },

  SwissTurnverband: {
    clubs: () => {
      return getClubs();
    },
    club: (parent: any, args: {
      clubId: string
    }, context: any, info: any) => {
      return getClub(args.clubId);
    },
    team: (parent: any, args: {
      teamId: string
    }, context: any, info: any) => {
      return getTeam(args.teamId);
    },
    teams: (parent: any, args: {
      clubId: string;season: string;
    }, context: any, info: any) => {
      return getTeams(args.clubId);
    },
    games: (parent: any, args: {
      teamId: string;season: string;
    }, context: any, info: any) => {
      return getGames(args.teamId);
    },
    clubGames: (parent: any, args: {
      clubId: string;season: string;
    }, context: any, info: any) => {
      return getClubGames(args.clubId);
    },

    rankings: (parent: any, args: {
      id: string;season: string;
    }, context: any, info: any) => {
      return getRankings(args.id);
    },
    news: () => {
      return getNews();
    },
  },
};

async function getTeams(clubIdParent: string) {
  try {
    const dom = new jsdom.JSDOM(html);
    const teamList = < any > [];
    const domList: NodeList = dom.window.document.querySelectorAll(".tx-stv-clubfinder-result");
    // console.log("NodeList Entries: " + domList.length);
    let clubId = 0;
    domList.forEach((clubListNode: Node, key:number, parent: NodeList) => { // here we have the clubs
      // const clubData: NodeList = domList[0].childNodes;
      const clubData: NodeList = clubListNode.childNodes;
      clubData.forEach((clubNode, key:number, parent: NodeList) => { // just one entry..
        // console.log(">> NEW CLUB");
        if (clubNode.hasChildNodes() && clubIdParent == String(clubId)) {
          const nodes = clubNode.childNodes;
          if (nodes[0].hasChildNodes()) { // CLUB NAME INFO
            // const contactNodeList = nodes[0].childNodes; // Index 0 -> Contact Eintrag
            const contactNode = nodes[0].childNodes[0]; // hat hier nur 1 Eintrag
            const angebotNode = nodes[1].childNodes[0]; // hat hier nur 1 Eintrag
            if (contactNode.hasChildNodes()) {
              const clubNameNode = contactNode.childNodes[0];
              console.log("Verein: " + clubNameNode.childNodes[0].textContent);
              let teamId = 0;
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
            }
          }
        }
      });
      clubId++;
    });

    return teamList;
  } catch (e) {
    console.log(e);
    return;
  }
}

async function getTeam(teamId: string) {
  /* const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId, {
    headers: headers,
  });
  const teamData = await data.json();
  // console.log(teamData);

  return {
    id: teamId,
    name: teamData.teamName,
  }; */
}
async function getClubs() {
  try {
    // https://stackoverflow.com/questions/65647010/read-file-with-firebase-function
    // __dirname (path.resolve(__dirname, './html/template.html')
    // const response = fs.readFileSync(path.resolve("./graphql/swissturnverband/stv-vereine.finder.html"));
    // const response = fs.readFileSync(`${__dirname}/stv-vereine.finder.html`);
    /* const response = await fetch("https://www.stv-fsg.ch/de/mitglied-verein/turnverein-finder/stv-vereine.finder.html?tx_stvclubfinder_finder%5Baction%5D=ajax&tx_stvclubfinder_finder%5Bcontroller%5D=Finder&cHash=8c21097e68b8ad9c8ee6c091281eb785", {
      "credentials": "include",
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
        "Accept": "* /*",
        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
      },
      "referrer": "https://www.stv-fsg.ch/de/mitglied-verein/turnverein-finder/stv-vereine.html",
      "body": "tx_stvclubfinder_finder%5B__referrer%5D%5B%40extension%5D=StvClubFinder&tx_stvclubfinder_finder%5B__referrer%5D%5B%40vendor%5D=Cabag&tx_stvclubfinder_finder%5B__referrer%5D%5B%40controller%5D=Finder&tx_stvclubfinder_finder%5B__referrer%5D%5B%40action%5D=show&tx_stvclubfinder_finder%5B__referrer%5D%5Barguments%5D=YToxOntzOjY6ImZpbHRlciI7YTozOntzOjQ6InR5cGUiO3M6MDoiIjtzOjM6InppcCI7czowOiIiO3M6NjoiZ2VuZGVyIjtzOjM6ImFsbCI7fX0%3Dc528405d17d84495de2a9a042a309dd82bc7ace1&tx_stvclubfinder_finder%5B__referrer%5D%5B%40request%5D=a%3A4%3A%7Bs%3A10%3A%22%40extension%22%3Bs%3A13%3A%22StvClubFinder%22%3Bs%3A11%3A%22%40controller%22%3Bs%3A6%3A%22Finder%22%3Bs%3A7%3A%22%40action%22%3Bs%3A4%3A%22show%22%3Bs%3A7%3A%22%40vendor%22%3Bs%3A5%3A%22Cabag%22%3B%7D367bc045fafa4f07d0f29256543374dd0805f487&tx_stvclubfinder_finder%5B__trustedProperties%5D=a%3A1%3A%7Bs%3A6%3A%22filter%22%3Ba%3A8%3A%7Bs%3A7%3A%22storage%22%3Bi%3A1%3Bs%3A10%3A%22contentUid%22%3Bi%3A1%3Bs%3A6%3A%22radius%22%3Bi%3A1%3Bs%3A4%3A%22type%22%3Bi%3A1%3Bs%3A3%3A%22zip%22%3Bi%3A1%3Bs%3A6%3A%22gender%22%3Bi%3A1%3Bs%3A3%3A%22age%22%3Bi%3A1%3Bs%3A7%3A%22weekday%22%3Bi%3A1%3B%7D%7D72a18e68f0be49cdf37dbbced0101b56a73e5532&tx_stvclubfinder_finder%5Bfilter%5D%5Bstorage%5D=310&tx_stvclubfinder_finder%5Bfilter%5D%5BcontentUid%5D=10086&tx_stvclubfinder_finder%5Bfilter%5D%5Bradius%5D=15&tx_stvclubfinder_finder%5Bfilter%5D%5Btype%5D=&tx_stvclubfinder_finder%5Bfilter%5D%5Bzip%5D=&tx_stvclubfinder_finder%5Bfilter%5D%5Bgender%5D=all&tx_stvclubfinder_finder%5Bfilter%5D%5Bage%5D=&tx_stvclubfinder_finder%5Bfilter%5D%5Bweekday%5D=all",
      "method": "POST",
      "mode": "cors",
    }); */

    // console.log(await response.text());
    // const dom = new jsdom.JSDOM(await response.text());

    const dom = new jsdom.JSDOM(html);
    const clubList = < any > [];
    const domList: NodeList = dom.window.document.querySelectorAll(".tx-stv-clubfinder-result");
    // console.log("NodeList Entries: " + domList.length);
    let id = 0;
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
            if (contactNode.hasChildNodes()) {
              const clubNameNode = contactNode.childNodes[0];
              const clubAddressNode = contactNode.childNodes[1];

              /*
              clubNameNode.childNodes
              0>  Wohlen DTV STV
              1>  5610 Wohlen, AG
              2>
              3>  www.dtvwohlen.ch

              clubAddressNode.childNodes
              0>  Kontakt
              1>  Claudia Deubelbeiss
              2>  +41 62 775 04 86
              3>  c.deubelbeissnoSpam@bluewin.ch */
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

              try {
                clubList.push({
                  id: id,
                  name: clubNameNode.childNodes[0].textContent,
                  address: [{
                    id: id,
                    firstName: clubAddressNode.childNodes[1].textContent,
                    lastName: clubAddressNode.childNodes[1].textContent,
                    street: "",
                    number: "",
                    postalcode: clubNameNode.childNodes[1].textContent,
                    city: clubNameNode.childNodes[1].textContent,
                    email: email,
                    phone: clubAddressNode.childNodes[2].textContent,
                    website: website,
                  }],
                });
              } catch (e) {
                console.log("error with club: " + clubNameNode.childNodes[0].textContent);
              }
              id++;

              /* for (let i = 0, l = clubNameNode.childNodes.length; i < l; ++i) {
                console.log(clubNameNode.childNodes[i].textContent);
              }
              for (let i = 0, l = clubAddressNode.childNodes.length; i < l; ++i) {
                console.log(clubAddressNode.childNodes[i].textContent);
              } */
            }
          }

          /*
          for (let i = 0, l = nodes.length; i < l; ++i) {
            // Index 1 = Kontakt, Index 2 = Angebot -> Teams relevant
            console.log(nodes[i].textContent);
          }
          */
        }
        // console.log(clubNode.nodeType); ELEMENT_NODE
      });
    });
    // let id = 0;
    // for (const club of domList) {
    // console.log("GET CLUB" );

    // console.log(club);

    // CONTACT
    // const contactData = club.childNodes[1].childNodes[1].children[0];
    // console.log("Clubname: " + contactData.children[0].children[0].textContent);
    //    window.document.querySelectorAll('.tx-stv-clubfinder-result')[0].childNodes[1].childNodes[1].children[0].children[0].children[0].innerText
    // console.log("Website: " + contactData.children[0].children[2].textContent);

    /* clubList.push({
        id: id,
        name: contactData.children[0].children[0].textContent,
        address: {
          id: id,
          firstName: contactData.children[1].children[1].textContent,
          lastName: contactData.children[1].children[1].textContent,
          street: "",
          number: "",
          // postalcode: contactData.children[0].childNodes[2].textContent.toString(),
          // city: contactData.children[0].childNodes[2].textContent.toString(),
          email: contactData.children[1].children[3].textContent,
          phone: contactData.children[1].children[2].textContent,
        },
      }); */
    // id++;
    // }
    return clubList;
  } catch (e) {
    console.log(e);
    return;
  }


  /*
  {
    id: clubId,
    name: clubData.clubName,
    address: {
      id: 1,
      firstName: "address.FirstName.$value",
      lastName: "address.LastName.$value",
      street: "address.Street.$value",
      number: "address.Number.$value",
      postalcode: "address.AreaCode.$value",
      city: "address.Place.$value",
      email: "address.Email.$value",
      phone: "",
    },
  };
  */
}

async function getClub(clubId: string) {
  console.log("");
}


async function getClubGames(clubId: string) {
  console.log("");
}

async function getGames(teamId: string) {
  console.log("");
}


async function getRankings(teamId: string) {
  console.log("");
}

async function getNews() {
  console.log("");
}
