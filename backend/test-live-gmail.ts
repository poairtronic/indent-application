import { GmailApiProvider } from './src/communication/providers/gmail-api.provider';
import * as dotenv from 'dotenv';
dotenv.config();

async function testEmail() {
  console.log('Testing Gmail API Provider live...');
  const provider = new GmailApiProvider();
  
  try {
    const result = await provider.sendEmail({
      to: ['test@example.com'], // using a dummy for safe test or I can just use a dummy text, but let's see if it authenticates.
      subject: 'IMCMS Phase 7 Live Verification Test',
      body: 'This is a live test of the Gmail API integration.',
      html: '<p>This is a <b>live test</b> of the Gmail API integration for IMCMS.</p>',
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error during live test:', error);
  }
}

testEmail();
