const fetch = require('node-fetch');

const testCategoriesAPI = async () => {
  try {
    console.log('🔍 Probando endpoint de categorías...');
    
    // Primero hacer login para obtener el token
    const loginResponse = await fetch('http://172.16.0.23:54116/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Admin',
        password: 'admin123' // Asumiendo que esta es la contraseña
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Error en login:', loginResponse.status, loginResponse.statusText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    
    // Ahora probar el endpoint de categorías
    const categoriasResponse = await fetch('http://172.16.0.23:54116/api/contabilidad/categorias-cuentas', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!categoriasResponse.ok) {
      console.log('❌ Error en categorías:', categoriasResponse.status, categoriasResponse.statusText);
      return;
    }
    
    const categorias = await categoriasResponse.json();
    console.log('✅ Categorías obtenidas:', categorias.length, 'total');
    
    // Filtrar solo las de ajustes
    const categoriasAjustes = categorias.filter(cat => 
      cat.subtipo && cat.subtipo.toLowerCase().includes('ajustes y correcciones')
    );
    
    console.log('📊 Categorías de ajustes encontradas:', categoriasAjustes.length);
    categoriasAjustes.forEach(cat => {
      console.log(`  - ${cat.codigo} | ${cat.nombre} (${cat.tipo})`);
    });
    
    if (categoriasAjustes.length === 0) {
      console.log('❌ No se encontraron categorías de ajustes en la respuesta del API');
    } else {
      console.log('✅ Las categorías de ajustes están llegando desde el backend');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testCategoriesAPI();