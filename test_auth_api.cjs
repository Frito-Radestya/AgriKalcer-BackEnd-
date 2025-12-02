const fetch = require('node-fetch');

async function testAuthAPI() {
  try {
    // Login dulu
    const loginResponse = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'frito.radestya@gmail.com', password: '123456' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('Login success, token:', token ? 'OK' : 'FAILED');
    
    // Test API lands dengan token
    const landsResponse = await fetch('http://localhost:4001/api/lands', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const landsData = await landsResponse.json();
    
    console.log('Lands API status:', landsResponse.status);
    console.log('Lands data:');
    
    if (Array.isArray(landsData)) {
      landsData.forEach(land => {
        console.log(`ID ${land.id}: ${land.name}`);
        console.log(`  - area_size: ${land.area_size}`);
        console.log(`  - latitude: ${land.latitude}`);
        console.log(`  - longitude: ${land.longitude}`);
        console.log(`  - location: ${land.location}`);
        console.log(`  - notes: ${land.notes}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testAuthAPI();
