// Test to trigger auth debugging
const http = require('http');

// Test with different scenarios
const tests = [
  {
    name: 'No token',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Invalid token',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token-123'
    }
  },
  {
    name: 'Malformed token',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer not.a.valid.jwt'
    }
  }
];

tests.forEach((test, index) => {
  const options = {
    hostname: 'localhost',
    port: 4001,
    path: '/api/notifications/mark-all-read',
    method: 'PUT',
    headers: test.headers
  };

  const req = http.request(options, (res) => {
    console.log(`\n=== TEST ${index + 1}: ${test.name} ===`);
    console.log(`STATUS: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('BODY:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`PROBLEM with test ${index + 1}: ${e.message}`);
  });

  // Send request
  req.write('');
  req.end();
});

console.log('Auth debugging tests sent...');
