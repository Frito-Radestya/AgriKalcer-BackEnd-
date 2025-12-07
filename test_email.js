import { sendNewPasswordEmail } from './src/utils/emailConfig.js';

async function testEmail() {
  try {
    console.log('Testing email sending...');
    const result = await sendNewPasswordEmail('frito@gmail.com', 'test123');
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testEmail();
