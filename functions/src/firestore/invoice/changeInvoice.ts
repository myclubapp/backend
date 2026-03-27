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
import {sendEmailByUserId, sendEmailWithAttachmentByUserId} from '../../utils/email.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
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

  const isSendTriggered = afterData?.status === 'send' && beforeData?.status === 'draft';

  if (isSendTriggered) {
    logger.info('Rechnung senden');

    const userProfileRef = await db.collection('userProfile').doc(invoiceId).get();
    const userProfileData = userProfileRef.data();

    // Detect incomplete profile data
    const missingFields: string[] = [];
    if (!userProfileData?.street) missingFields.push('street');
    if (!userProfileData?.houseNumber) missingFields.push('houseNumber');
    if (!userProfileData?.city) missingFields.push('city');
    if (!userProfileData?.postalcode) missingFields.push('postalCode');
    if (!userProfileData?.country) missingFields.push('country');
    const hasIncompleteProfile = missingFields.length > 0;

    if (hasIncompleteProfile) {
      logger.warn(`Incomplete profile for user ${invoiceId}. Missing: ${missingFields.join(', ')}`);
    }

    // QR-Reference: 26 Ziffern + 1 MOD10-Prüfziffer = 27 Zeichen
    const rawRef = (afterData?.referenceNumber || '').replace(/\s/g, '');
    const base = rawRef.replace(/\D/g, '').padStart(26, '0').slice(-26);
    const mod10Table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
    let carry = 0;
    for (let i = 0; i < base.length; i++) {
      carry = mod10Table[(carry + parseInt(base[i], 10)) % 10];
    }
    const validReference = base + ((10 - carry) % 10).toString();

    // https://github.com/schoero/swissqrbill
    const data = {
      amount: afterData?.amount,
      additionalInformation: afterData?.referenceNumber,
      message: afterData?.purpose + ' ' + afterData?.firstName + ' ' + afterData?.lastName,
      creditor: clubData.creditor,
      currency: afterData?.currency,
      debtor: {
        address: userProfileData?.street || clubData.creditor.address || 'N/A',
        buildingNumber: userProfileData?.houseNumber || '',
        city: userProfileData?.city || clubData.creditor.city || 'N/A',
        country: userProfileData?.country || 'CH',
        name: (afterData?.firstName || '') + ' ' + (afterData?.lastName || ''),
        zip: userProfileData?.postalcode || clubData.creditor.zip || '0000',
      },
      reference: validReference,
    };

    // eslint-disable-next-line no-async-promise-executor
    const PDFBuffer: Buffer = await new Promise(async (resolve, reject) => {
      const pdf = new PDFDocument({size: 'A4'});
      const chunks: Buffer[] = [];

      try {
        const qrBill = new SwissQRBill(data);
        qrBill.attachTo(pdf);
      } catch (qrError) {
        logger.error('QR Bill generation failed, generating PDF without QR code', qrError);
        pdf.fontSize(10);
        pdf.fillColor('red');
        pdf.text('QR-Einzahlungsschein konnte nicht generiert werden. Bitte kontaktiere den Clubadministrator.', mm2pt(20), mm2pt(240), {
          width: mm2pt(170),
        });
        pdf.fillColor('black');
      }

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
                align: 'left' as const,
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
                align: 'right' as const,
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
                text: `${afterData?.currency} ${afterData?.amount}`,
                width: mm2pt(30),
                align: 'right' as const,
              },
            ],
            height: 40,
            padding: 5,
          },
        ],
        width: mm2pt(170),
      });

      table.attachTo(pdf);

      if (hasIncompleteProfile) {
        pdf.moveDown(2);
        pdf.fontSize(9);
        pdf.fillColor('red');
        pdf.font('Helvetica-Oblique');
        pdf.text(
            'Hinweis: Die Adressdaten sind unvollständig. Bitte aktualisiere dein Profil in der myclub App, damit zukünftige Rechnungen korrekt erstellt werden können.',
            mm2pt(20), undefined, {width: mm2pt(170)},
        );
        pdf.fillColor('black');
        pdf.font('Helvetica');
      }

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
          hasIncompleteProfile: hasIncompleteProfile,
          incompleteProfileNote: hasIncompleteProfile ?
            'Achtung: Deine Adressdaten in deinem Profil sind unvollständig. Bitte aktualisiere deine Adresse in der myclub App, damit zukünftige Rechnungen korrekt erstellt werden können.' :
            '',
        },
        {
          filename: 'qr-bill.pdf',
          content: PDFBuffer.toString('base64'),
          contentType: 'application/pdf',
          encoding: 'base64',
        },
    );

    if (userProfileData?.settingsPush) {
      await sendPushNotificationByUserProfileId(invoiceId, 'Neue Rechnung ' + afterData?.purpose, 'Eine neue Rechnung wurde erstellt', {
        'type': 'invoice',
        'periodId': periodId,
        'clubId': clubId,
        'id': invoiceId,
      });
    }

    return db.collection('club').doc(clubId).collection('invoicePeriods').doc(periodId).collection('invoices').doc(invoiceId).update({
      updatedAt: Timestamp.now(),
      status: 'sent',
    });
  }
  // Zahlungserinnerung
  const reminderTriggered = afterData?.lastReminderSent &&
    (!beforeData?.lastReminderSent || afterData?.lastReminderSent > beforeData?.lastReminderSent);

  if (reminderTriggered && afterData?.status === 'sent') {
    logger.info('Zahlungserinnerung senden');

    const userProfileRef = await db.collection('userProfile').doc(invoiceId).get();
    const userProfileData = userProfileRef.data();

    await sendEmailByUserId(
        invoiceId,
        'InvoiceReminder',
        {
          clubName: clubData?.name,
          firstName: afterData?.firstName,
          lastName: afterData?.lastName,
          invoiceAmount: afterData?.amount,
          invoiceCurrency: afterData?.currency,
          purpose: afterData?.purpose,
          clubLogo: clubData?.logo,
          subject: `Zahlungserinnerung ${clubData?.name} - ${afterData?.purpose}`,
        },
        false,
        ['InvoiceReminder', 'InvoiceReminderFr', 'InvoiceReminderIt'],
    );

    if (userProfileData?.settingsPush) {
      await sendPushNotificationByUserProfileId(invoiceId,
          'Zahlungserinnerung: ' + afterData?.purpose,
          `Offener Betrag: ${afterData?.amount} ${afterData?.currency}`,
          {
            'type': 'invoice',
            'periodId': periodId,
            'clubId': clubId,
            'id': invoiceId,
          });
    }
  }

  return true;
}
