const fetch = require('node-fetch');

async function testForgotPassword() {
  try {
    console.log('🧪 Testing forgot password API...');
    
    // Test forgot password
    const forgotResponse = await fetch('http://localhost:4001/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'frito.radestya@gmail.com' })
    });
    
    const forgotData = await forgotResponse.json();
    
    console.log('Forgot password status:', forgotResponse.status);
    console.log('Forgot password response:', forgotData);
    
    if (forgotData.resetLink) {
      console.log('Reset link generated:', forgotData.resetLink);
      
      // Extract token from reset link
      const tokenMatch = forgotData.resetLink.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        console.log('Token extracted:', token);
        
        // Test reset password
        const resetResponse = await fetch('http://localhost:4001/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: token, 
            newPassword: 'newpassword123' 
          })
        });
        
        const resetData = await resetResponse.json();
        
        console.log('Reset password status:', resetResponse.status);
        console.log('Reset password response:', resetData);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testForgotPassword();
