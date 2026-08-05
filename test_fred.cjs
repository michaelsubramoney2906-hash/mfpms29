const fs = require('fs');

async function test() {
  const prompt = fs.readFileSync('test_input.txt', 'utf8');
  const res = await fetch('http://localhost:3000/api/fred/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, fileData: null, mimeType: null })
  });
  
  if (!res.ok) {
    console.error("Failed:", await res.text());
  } else {
    console.log("Success!");
  }
}
test();
