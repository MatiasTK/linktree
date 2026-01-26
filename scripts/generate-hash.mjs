// Script to generate a password hash for ADMIN_PASSWORD_HASH environment variable
// Usage: node scripts/generate-hash.mjs <your-password>

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate-hash.mjs <your-password>');
  process.exit(1);
}

async function hashPassword(password) {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

const hash = await hashPassword(password);

console.log('\n✅ Password hash generated!\n');
console.log('Add this to your Cloudflare Worker environment variables:');
console.log('─'.repeat(60));
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('─'.repeat(60));
console.log('\nTo add via Wrangler CLI:');
console.log(`npx wrangler secret put ADMIN_PASSWORD_HASH`);
console.log('Then paste the hash when prompted.\n');
