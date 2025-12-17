// Script para verificar el token almacenado en el navegador
// Ejecutar este código en la consola del navegador

console.log('=== VERIFICACIÓN DE TOKEN ===');

// Verificar si existe token
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
console.log('Token encontrado:', !!token);

if (token) {
    console.log('Primeros 50 caracteres del token:', token.substring(0, 50) + '...');
    
    // Decodificar JWT
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        console.log('Payload decodificado:', decoded);
        
        // Verificar expiración
        if (decoded.exp) {
            const expirationDate = new Date(decoded.exp * 1000);
            const now = new Date();
            console.log('Token expira en:', expirationDate);
            console.log('Fecha actual:', now);
            console.log('Token expirado:', now > expirationDate);
        }
        
    } catch (e) {
        console.error('Error decodificando token:', e);
    }
} else {
    console.log('No hay token almacenado');
    
    // Generar token de prueba
    console.log('\n=== GENERANDO TOKEN DE PRUEBA ===');
    
    // Simulamos la generación de un token válido
    const payload = {
        id: 'test-user-id',
        email: 'admin@test.com',
        roles: ['Administrador'],
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expira en 1 hora
    };
    
    // Nota: En producción el token debe ser generado por el servidor
    console.log('Para testing, puedes generar un token usando el endpoint de login');
    console.log('O almacenar temporalmente un token válido:');
    console.log('localStorage.setItem("auth_token", "TU_TOKEN_AQUI");');
}