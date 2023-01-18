import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp(functions.config().firebase);
const database = admin.database();

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

interface Guest {
    first: string;
    last: string;
    joining: string;
    diner: string;
    restriction: string;
}

// eslint-disable-next-line max-len
export const addGuests = functions.https.onRequest(async (request, response) => {
  const guests = request.body.guests as Guest[];
  for (const guest of guests) {
    await database.ref(`guests/${guest.first}_${guest.last}`).set({
      joining: guest.joining,
      diner: guest.diner,
      restriction: guest.restriction,
    });
  }
  response.sendStatus(204);
});
