const jwt = require('jsonwebtoken');

// Usar el JWT_SECRET correcto del servidor
const JWT_SECRET = 'super-secret-jwt-key-change-in-production-2025';

// Generar token válido como lo haría el servidor
const payload = {
  id: 'df4b1335-5ff6-4703-8dcd-3e2f74fb0822', // ID de usuario real de la base
  username: 'admin',
  email: 'admin@test.com',
  roles: ['Administrador'],
  permissions: ['*'], // Permisos de administrador
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expira en 24 horas
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('=== TOKEN VÁLIDO GENERADO ===');
console.log('Token completo:');
console.log(token);
console.log('\n=== INSTRUCCIONES ===');
console.log('1. Abre el navegador y ve a http://172.16.0.23:5173');
console.log('2. Abre las DevTools (F12)');
console.log('3. Ve a la consola');
console.log('4. Ejecuta este comando:');
console.log(`localStorage.setItem('auth_token', '${token}');`);
console.log('5. Recarga la página');
console.log('\nEsto debería resolver el error 500 temporalmente.');