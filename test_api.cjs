const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Test without auth first
    const response = await fetch('http://localhost:4001/api/lands');
    const data = await response.json();
    
    console.log('API Response status:', response.status);
    console.log('API Response data:');
    console.log(data);
    
    if (Array.isArray(data)) {
      data.forEach(land => {
        console.log(`ID ${land.id}: ${land.name} - area_size: ${land.area_size}, latitude: ${land.latitude}, longitude: ${land.longitude}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testAPI();
