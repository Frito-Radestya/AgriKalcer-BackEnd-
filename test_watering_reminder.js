// Test watering reminder system
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/reminders/check-watering',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-token' // This will fail, but we can see the error
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
