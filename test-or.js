const https = require('https');

const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.argv[2]}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', console.error);

req.write(JSON.stringify({
  model: 'google/gemini-2.5-flash',
  messages: [{role: 'user', content: 'hello'}]
}));
req.end();
