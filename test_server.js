import fetch from 'node-fetch';

try {
  const response = await fetch('http://localhost:3001/');
  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Body: ${text}`);
} catch (error) {
  console.error('Error connecting to server:', error.message);
  process.exit(1);
}