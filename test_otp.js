import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4001/api';

async function testOTP() {
  try {
    const testEmail = 'test@example.com';
    
    // Test 1: Send OTP
    console.log('Sending OTP...');
    const sendResponse = await fetch(`${BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        purpose: 'verification'
      })
    });
    
    const sendResult = await sendResponse.json();
    console.log('Send OTP Result:', sendResult);
    
    if (!sendResult.success) {
      throw new Error('Failed to send OTP');
    }
    
    // In a real scenario, you would get the OTP from the user's email
    // For testing, we'll simulate user input
    const testOTP = prompt('Please enter the OTP sent to your email:');
    
    if (!testOTP) {
      console.log('No OTP provided, skipping verification test');
      return;
    }
    
    // Test 2: Verify OTP
    console.log('\nVerifying OTP...');
    const verifyResponse = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        otp: testOTP,
        purpose: 'verification'
      })
    });
    
    const verifyResult = await verifyResponse.json();
    console.log('Verify OTP Result:', verifyResult);
    
  } catch (error) {
    console.error('Error testing OTP:', error);
  }
}

// Run the test
testOTP();
