// Test manual API call to debug NaN issue
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/notifications/mark-all-read',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer fake-token-for-testing'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM: ${e.message}`);
});

// Send request
req.write('');
req.end();

console.log('Test request sent to /api/notifications/mark-all-read');
