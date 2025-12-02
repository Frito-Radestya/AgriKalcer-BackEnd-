const fetch = require('node-fetch');

async function testUpdateAPI() {
  try {
    // Login dulu
    const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'frito.radestya@gmail.com', password: '123456' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('Login success');
    
    // Test update land ID 1
    const updateData = {
      name: 'RIAU - TEST UPDATE',
      location: 'Test location',
      area_size: 9999.00,
      latitude: -7.123456,
      longitude: 110.654321,
      notes: 'Test notes update'
    };
    
    const updateResponse = await fetch('http://localhost:4001/api/lands/1', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    console.log('Update API status:', updateResponse.status);
    console.log('Update response:', updateResult);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testUpdateAPI();
