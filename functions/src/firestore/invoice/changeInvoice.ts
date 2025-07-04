/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {Timestamp} from 'firebase-admin/firestore';
import {Buffer} from 'node:buffer';
import PDFDocument from 'pdfkit';
import {SwissQRBill} from 'swissqrbill/pdf';
import {mm2pt} from 'swissqrbill/utils';
import {Table} from 'swissqrbill/pdf';
import {sendEmailWithAttachmentByUserId} from '../../utils/email.js';
import fetch from 'node-fetch';

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
      additionalInformation: afterData?.referenceNumber,
      message: afterData?.purpose + ' ' + afterData?.firstName + ' ' + afterData?.lastName,
      creditor: clubData.creditor,
      currency: afterData?.currency,
      debtor: {
        address: userProfileData?.street || '',
        buildingNumber: userProfileData?.houseNumber || '',
        city: userProfileData?.city || clubData.creditor.city,
        country: userProfileData?.country || 'CH',
        name: afterData?.firstName + ' ' + afterData?.lastName,
        zip: userProfileData?.postalcode || clubData.creditor.zip,
      },
      reference: afterData?.referenceNumber,
    };

    // eslint-disable-next-line no-async-promise-executor
    const PDFBuffer: Buffer = await new Promise(async (resolve, reject) => {
      const pdf = new PDFDocument({size: 'A4'});
      const qrBill = new SwissQRBill(data);
      const chunks: Buffer[] = [];
      qrBill.attachTo(pdf);

      // adding a logo
      const logoUrl = clubData.logo || 'https://my-club.app/icons/icon-512x512.png';
      let logoBuffer: Buffer | undefined = undefined;

      if (logoUrl) {
        const response = await fetch(logoUrl);
        if (response.ok) {
          logoBuffer = Buffer.from(await response.arrayBuffer());
        }
      }

      if (logoBuffer) {
        pdf.image(logoBuffer, mm2pt(20), mm2pt(5), {width: mm2pt(30)});
      }

      // Adding the addresses
      pdf.fontSize(12);
      pdf.fillColor('black');
      pdf.font('Helvetica');
      pdf.text(`${data.creditor.name}\n${data.creditor.address} ${data.creditor.buildingNumber}\n${data.creditor.zip} ${data.creditor.city}`, mm2pt(20), mm2pt(40), {
        align: 'left',
        height: mm2pt(50),
        width: mm2pt(100),
      });
      pdf.fontSize(12);
      pdf.font('Helvetica');
      pdf.text(`${data.debtor.name}\n${data.debtor.address} ${data.debtor.buildingNumber}\n${data.debtor.zip} ${data.debtor.city}`, mm2pt(130), mm2pt(60), {
        align: 'left',
        height: mm2pt(50),
        width: mm2pt(70),
      });

      // Create Title
      pdf.fontSize(14);
      pdf.font('Helvetica-Bold');
      pdf.text(`Rechnung Nr. ${afterData?.referenceNumber}`, mm2pt(20), mm2pt(100), {
        align: 'left',
        width: mm2pt(170),
      });

      const date = new Date();

      pdf.fontSize(11);
      pdf.font('Helvetica');
      pdf.text(`${data.debtor.city} ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`, {
        align: 'right',
        width: mm2pt(170),
      });

      const invoicePositions = [];
      let idx = 1;
      // eslint-disable-next-line no-unsafe-optional-chaining
      for (const item of afterData?.positions) {
        invoicePositions.push({
          columns: [
            {
              text: idx,
              width: mm2pt(20),
            }, {
              text: '1 x',
              width: mm2pt(20),
            }, {
              text: item.name,
            }, {
              text: `${item?.waehrung} ${item?.amount}`,
              width: mm2pt(30),
              align: 'right' as const,
            },
          ],
          padding: 5,
        });
        idx++;
      }

      // Add Table
      const table = new Table({
        rows: [
          {
            backgroundColor: '#4A4D51',
            columns: [
              {
                text: 'Position',
                width: mm2pt(20),
              }, {
                text: 'Anzahl',
                width: mm2pt(20),
              }, {
                text: 'Bezeichnung',
              }, {
                text: 'Total',
                width: mm2pt(30),
                align: 'right',
              },
            ],
            fontName: 'Helvetica-Bold',
            height: 20,
            padding: 5,
            textColor: '#fff',
            verticalAlign: 'center',
          },
          ...invoicePositions,
          {
            columns: [
              {
                text: '',
                width: mm2pt(20),
              }, {
                text: '',
                width: mm2pt(20),
              }, {
                fontName: 'Helvetica-Bold',
                text: 'Summe',
              }, {
                fontName: 'Helvetica-Bold',
                text: `${afterData?.currency} ${afterData?.amount}`,
                width: mm2pt(30),
              },
            ],
            height: 40,
            padding: 5,
          },
          /* {
            columns: [
              {
                text: '',
                width: mm2pt(20),
              }, {
                text: '',
                width: mm2pt(20),
              }, {
                text: 'MwSt.',
              }, {
                text: '7.7%',
                width: mm2pt(30),
              },
            ],
            padding: 5,
          },
          {
            columns: [
              {
                text: '',
                width: mm2pt(20),
              }, {
                text: '',
                width: mm2pt(20),
              }, {
                text: 'MwSt. Betrag',
              }, {
                text: 'CHF 186.35',
                width: mm2pt(30),
              },
            ],
            padding: 5,
          }, */{
            columns: [
              {
                text: '',
                width: mm2pt(20),
              }, {
                text: '',
                width: mm2pt(20),
              }, {
                fontName: 'Helvetica-Bold',
                text: 'Rechnungstotal',
              }, {
                fontName: 'Helvetica-Bold',
                text: `CHF ${afterData?.currency} ${afterData?.amount}`,
                width: mm2pt(30),
              },
            ],
            height: 40,
            padding: 5,
          },
        ],
        width: mm2pt(170),
      });

      table.attachTo(pdf);

      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);
      pdf.end();
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
          clubLogo: clubData.logo,
          filename: `Rechnung-${afterData?.firstName}-${afterData?.lastName}-${afterData?.purpose}.pdf`,
          subject: `Rechnung ${clubData?.name} - ${afterData?.purpose}`,
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
