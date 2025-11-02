#!/usr/bin/env node
/**
 * Script para generar secrets seguros para producción
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generatePassword(length = 24) {
  return crypto.randomBytes(length).toString('base64url');
}

console.log('\n🔐 SEGRETS GENERADOS PARA PRODUCCIÓN\n');
console.log('Copiá estos valores a tus variables de entorno:\n');
console.log('─'.repeat(60));
console.log('\nNEXTAUTH_SECRET=' + generateSecret());
console.log('\nDATABASE_URL=postgresql://usuario:password@host:5432/database');
console.log('OPENAI_API_KEY=sk-tu-key-aqui');
console.log('\n─'.repeat(60));
console.log('\n⚠️  IMPORTANTE:');
console.log('1. Nunca compartas estos valores públicamente');
console.log('2. Guardá esto en un gestor de secretos (1Password, LastPass, etc.)');
console.log('3. No commitear estos valores al repo');
console.log('\n');

