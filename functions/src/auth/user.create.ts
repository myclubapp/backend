import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export function authUserCreate(user: admin.auth.UserRecord, context: functions.EventContext) {
  //update user profile
  db.collection("userProfile").doc(`${user.uid}`).set({
    "email": user.email,
    "id": user.uid,
    "status": true
  }, {
    merge: true,
  }).then(ok => {
    return "ok";
  }).catch(e => {
    return "error";
  });

}

export function authUserCreateSendWelcomeMail(user: admin.auth.UserRecord, context: functions.EventContext) {
  /*return db.collection('mail').add({
    to: user.email,
    template: {
      name: 'userCreateWelcome',
    },
  });*/
  return db.collection('mail').add({
    to: user.email,
    message: {
      subject: 'Willkommen bei myclub | the next generation',
      text: `Hallo, Willkommen bei myclub | the next generation! Du hast dich erfolgreich registriert. Damit du loslegen kannst, musst du noch deine E-Mail Adresse bestätigen. Du hast dafür eine separate E-Mail von uns erhalten. Prüfe gegebenenfalls deinen Spam Ordner, falls du keine E-Mail in deinem Posteingang siehst.  Nachdem du deine E-Mail Adresse erfolgreich validiert hast, kannst du dich auf "my-club | the next generation" einloggen und einem Club beitreten.  Wenn du die App öffnest, zeigen wir dir ein kleines Tutorial, wo wir dir die wichtigsten Funktionen nochmals beschreiben. Zudem bitten wir dich, unsere AGB's zu akzeptieren. Das ist wichtig, damit du auch genau weist, was wir mit deinen Daten machen (oder eben genau nicht machen). Du kannst dir die AGB's jederzeit auf https://my-club.app/agb anschauen. Falls es mal zu einem Problem kommt, kannst du im Menu ganz einfach eine Supportanfrage stellen. Das war's auch schon von uns, viel Spass mit deinem Club!`,
      html: `Hallo,<br/>
        Willkommen bei myclub | the next generation! <br/>
        Du hast dich erfolgreich registriert. Damit du loslegen kannst, musst du noch deine E-Mail Adresse bestätigen. Du hast dafür eine separate E-Mail von uns erhalten. Prüfe gegebenenfalls deinen Spam Ordner, falls du keine E-Mail in deinem Posteingang siehst. <br/>
        Nachdem du deine E-Mail Adresse erfolgreich validiert hast, kannst du dich auf "my-club | the next generation" einloggen und einem Club beitreten. <br/>
        Wenn du die App öffnest, zeigen wir dir ein kleines Tutorial, wo wir dir die wichtigsten Funktionen nochmals beschreiben. Zudem bitten wir dich, unsere AGB's zu akzeptieren. Das ist wichtig, damit du auch genau weist, was wir mit deinen Daten machen (oder eben genau nicht machen).<br/>
        Du kannst dir die AGB's jederzeit auf https://my-club.app/agb anschauen. Falls es mal zu einem Problem kommt, kannst du im Menu ganz einfach eine Supportanfrage stellen. <br/>
        Das war's auch schon von uns, viel Spass mit deinem Club!<br/>
        
        Vielen Grüsse!<br/>
        Das myclub-Team`,
    }
  }).then(() => console.log('Queued email for delivery!'));


}

export function authUserCreateSendVerifyMail(user: admin.auth.UserRecord, context: functions.EventContext) {
  //Send E-Mail that user has to verify his account first.
  if (!user.emailVerified) {
    return admin
      .auth()
      .generateEmailVerificationLink(user.email as string)
      .then((code: string) => {
        /*return db.collection('mail').add({
          to: user.email,
          template: {
            name: 'userCreateSendVerify',
            data: {
              code: code,
            },
          },
        });*/
      return db.collection('mail').add({
        to: user.email,
        message: {
        subject: 'myclub | the next generation | E-Mail-Adresse verifizieren',
        text: `Hallo,Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen. ${code} Falls Sie nicht um die Möglichkeit zur Bestätigung dieser E-Mail-Adresse gebeten haben, können Sie diese E-Mail ignorieren.Vielen Dank!Das myclub-Team`,
        html: `Hallo,<br/>
        Klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen.Falls Sie nicht um die Möglichkeit zur Bestätigung dieser E-Mail-Adresse gebeten haben, können Sie diese E-Mail ignorieren.<br/>
        ${code}<br/>
        Vielen Dank!<br/>
        Das myclub-Team`,
        }
      }).then(() => console.log('Queued email for delivery!'));



      });
  } else {
    return;
  }
}