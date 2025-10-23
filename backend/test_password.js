const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu';

const passwords = [
  'superadmin123',
  'admin123',
  'password',
  'admin',
  'superadmin',
  '123456',
  'password123',
  'admin1234',
  'super123'
];

console.log('Testing passwords against stored hash:');
console.log('Stored hash:', storedHash);
console.log('');

const testPassword = async (password) => {
  try {
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log(`Password: "${password}" (${password.length} chars) -> ${isMatch ? 'MATCH ✓' : 'NO MATCH ✗'}`);
    return isMatch;
  } catch (error) {
    console.log(`Error testing "${password}":`, error.message);
    return false;
  }
};

const testAllPasswords = async () => {
  for (const password of passwords) {
    const isMatch = await testPassword(password);
    if (isMatch) {
      console.log(`\n🎉 FOUND THE CORRECT PASSWORD: "${password}"\n`);
      return;
    }
  }
  
  console.log('\nTesting some variations:');
  const variations = ['Admin123', 'SUPERADMIN123', 'SuperAdmin123'];
  for (const password of variations) {
    const isMatch = await testPassword(password);
    if (isMatch) {
      console.log(`\n🎉 FOUND THE CORRECT PASSWORD: "${password}"\n`);
      return;
    }
  }
  
  console.log('\n❌ None of the tested passwords matched the stored hash.');
};

testAllPasswords();