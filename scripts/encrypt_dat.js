const fs = require('fs');

const KEY = 'EngLearn2026XX';

function xor(bytes, key) {
  const keyBytes = Buffer.from(key, 'utf8');
  const out = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  return out;
}

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.log('Usage: node scripts/encrypt_dat.js input.json output.dat');
  process.exit(1);
}
const parsed = JSON.parse(fs.readFileSync(input, 'utf8'));
const json = JSON.stringify(parsed);
const encrypted = xor(Buffer.from(json, 'utf8'), KEY).toString('base64');
fs.writeFileSync(output, encrypted);
console.log(`Encrypted ${input} -> ${output}`);
