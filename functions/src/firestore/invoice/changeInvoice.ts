/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {Timestamp} from 'firebase-admin/firestore';
import {Buffer} from 'node:buffer';
import PDFDocument from 'pdfkit';
import {SwissQRBill} from 'swissqrbill/pdf';
import {sendEmailWithAttachmentByUserId} from '../../utils/email.js';

const db = firebaseDAO.instance.db;

export async function changeClubMemberInvoice(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeClubMemberInvoice');
  const {clubId, periodId, invoiceId} = event.params;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  console.log(clubId, periodId, invoiceId);

  // Behandlung von Event-Absagen
  if (afterData?.status === 'send' && beforeData?.status === 'draft') {
    logger.info('Rechnung senden');

    const userProfileRef = await db.collection('userProfile').doc(invoiceId).get();
    const userProfileData = userProfileRef.data();

    const data = {
      amount: afterData?.amount,
      creditor: {
        account: 'CH44 3199 9123 0008 8901 2',
        address: 'Musterstrasse',
        buildingNumber: 7,
        city: 'Musterstadt',
        country: 'CH',
        name: 'SwissQRBill',
        zip: 1234,
      },
      currency: afterData?.currency,
      debtor: {
        address: userProfileData?.street,
        buildingNumber: userProfileData?.houseNumber,
        city: userProfileData?.city,
        country: userProfileData?.country,
        name: afterData?.firstName + ' ' + afterData?.lastName,
        zip: userProfileData?.postalCode,
      },
      reference: '21 00000 00003 13947 14300 09017',
    };

    const PDFBuffer: Buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({size: 'A4'});
      const qrBill = new SwissQRBill(data);
      const chunks: Buffer[] = [];
      qrBill.attachTo(doc);
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });

    await sendEmailWithAttachmentByUserId(
        invoiceId, // this is the user id
        'Invoice',
        {
          clubName: afterData?.clubName,
          firstName: afterData?.firstName,
          lastName: afterData?.lastName,
        },
        {
          filename: 'qr-bill.pdf',
          content: PDFBuffer.toString('base64'),
          contentType: 'application/pdf',
        },
    );

    return db.collection('club').doc(clubId).collection('invoicePeriods').doc(periodId).collection('invoices').doc(invoiceId).update({
      updatedAt: Timestamp.now(),
      status: 'sent',
    });
  }
  return true;
}
