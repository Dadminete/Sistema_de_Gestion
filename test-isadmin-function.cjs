// Script para probar el debug del frontend
console.log('🔍 Testing isAdmin function...');

// Simular estructura de usuario del AuthProvider
const mockUser1 = {
  id: 'test-id',
  username: 'Admin',
  nombre: 'Administrador',
  apellido: 'Sistema',
  roles: ['Administrador'],  // Array de strings
  permissions: ['gestionar_usuarios', 'gestionar_roles', 'sistema.permisos']
};

const mockUser2 = {
  id: 'test-id-2',
  username: 'user',
  nombre: 'Usuario',
  apellido: 'Normal',
  roles: ['Usuario'],
  permissions: ['ver_dashboard']
};

const mockUser3 = {
  id: 'test-id-3',
  username: 'gerente',
  nombre: 'Gerente',
  apellido: 'Sistema',
  roles: ['Gerente'],
  permissions: ['gestionar_usuarios'] // Solo un permiso admin
};

// Función isAdmin corregida
const isAdmin = (user) => {
  if (!user) return false;
  return user.roles?.includes('Administrador') || 
         user.permissions?.includes('gestionar_usuarios') ||
         user.permissions?.includes('gestionar_roles') ||
         user.permissions?.includes('sistema.permisos');
};

// Función de filtrado de categorías
const filterCategories = (categories, user) => {
  // 🔒 SEGURIDAD: Solo mostrar categorías de ajustes a administradores
  if (!isAdmin(user)) {
    return categories.filter(cat => 
      !cat.subtipo || 
      !cat.subtipo.toLowerCase().includes('ajustes y correcciones')
    );
  }
  return categories;
};

// Categorías de prueba
const testCategories = [
  { id: '1', nombre: 'Ventas', tipo: 'ingreso', subtipo: null },
  { id: '2', nombre: 'Cuadre de Cajas - Ingreso', tipo: 'ingreso', subtipo: 'Ajustes y Correcciones' },
  { id: '3', nombre: 'Gastos Generales', tipo: 'gasto', subtipo: null },
  { id: '4', nombre: 'Ajuste Contable - Gasto', tipo: 'gasto', subtipo: 'Ajustes y Correcciones' },
];

// Pruebas
console.log('\n📋 Resultados de las pruebas:');

console.log('\n1. Usuario Administrador (por rol):');
console.log('   isAdmin():', isAdmin(mockUser1));
const filteredAdmin = filterCategories(testCategories, mockUser1);
console.log('   Categorías visibles:', filteredAdmin.length, '/', testCategories.length);
filteredAdmin.forEach(cat => {
  console.log('   -', cat.nombre, cat.subtipo ? `(${cat.subtipo})` : '');
});

console.log('\n2. Usuario Normal:');
console.log('   isAdmin():', isAdmin(mockUser2));
const filteredUser = filterCategories(testCategories, mockUser2);
console.log('   Categorías visibles:', filteredUser.length, '/', testCategories.length);
filteredUser.forEach(cat => {
  console.log('   -', cat.nombre, cat.subtipo ? `(${cat.subtipo})` : '');
});

console.log('\n3. Usuario con permiso admin específico:');
console.log('   isAdmin():', isAdmin(mockUser3));
const filteredGerente = filterCategories(testCategories, mockUser3);
console.log('   Categorías visibles:', filteredGerente.length, '/', testCategories.length);
filteredGerente.forEach(cat => {
  console.log('   -', cat.nombre, cat.subtipo ? `(${cat.subtipo})` : '');
});

console.log('\n✅ Test completado!');