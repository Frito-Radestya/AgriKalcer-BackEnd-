import { encrypt } from './src/utils/emailConfig.js';

const password = 'Frito2205'; // Ganti dengan password Anda
const encryptionKey = 'your-32-character-encryption-key-here'; // Ganti dengan ENCRYPTION_KEY dari .env

const encryptedPassword = encrypt(password, encryptionKey);
console.log('Encrypted password:', encryptedPassword);
