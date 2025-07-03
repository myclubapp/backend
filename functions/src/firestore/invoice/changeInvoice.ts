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

  const clubRef = await db.collection('club').doc(clubId).get();
  const clubData = clubRef.data();

  if (afterData?.status === 'send' && beforeData?.status === 'draft') {
    logger.info('Rechnung senden');

    const userProfileRef = await db.collection('userProfile').doc(invoiceId).get();
    const userProfileData = userProfileRef.data();

    // https://github.com/schoero/swissqrbill
    const data = {
      amount: afterData?.amount,
      creditor: clubData.creditor,
      currency: afterData?.currency,
      debtor: {
        address: userProfileData?.street || 'Musterstrasse',
        buildingNumber: userProfileData?.houseNumber || 1,
        city: userProfileData?.city || 'Musterstadt',
        country: userProfileData?.country || 'CH',
        name: afterData?.firstName + ' ' + afterData?.lastName,
        zip: userProfileData?.postalcode || 1234,
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
          clubName: clubData?.name,
          firstName: afterData?.firstName,
          lastName: afterData?.lastName,
          invoiceAmount: afterData?.amount,
          invoiceCurrency: afterData?.currency,
          purpose: afterData?.purpose,
          invoice_base64: PDFBuffer.toString('base64'),
          filename: `Rechnung-${afterData?.firstName}-${afterData?.lastName}-${afterData?.purpose}.pdf`,
        },
        {
          filename: 'qr-bill.pdf',
          content: PDFBuffer.toString('base64'),
          contentType: 'application/pdf',
          encoding: 'base64',
        },
    );

    return db.collection('club').doc(clubId).collection('invoicePeriods').doc(periodId).collection('invoices').doc(invoiceId).update({
      updatedAt: Timestamp.now(),
      status: 'sent',
    });
  }
  return true;
}
