// Script simple para verificar la lógica de pagos anticipados
const hoy = new Date('2025-12-22');

// Simular algunos casos
const casos = [
  {
    nombre: 'Cliente que paga día 10',
    diaFacturacion: 15,
    diaPago: 10,
    esperado: true // Debe aparecer como anticipado
  },
  {
    nombre: 'Cliente que paga día 15',
    diaFacturacion: 15,
    diaPago: 15,
    esperado: false // NO debe aparecer (pagó exacto)
  },
  {
    nombre: 'Cliente que paga día 20',
    diaFacturacion: 15,
    diaPago: 20,
    esperado: false // NO debe aparecer (pagó tarde)
  },
  {
    nombre: 'Cliente que paga día 28',
    diaFacturacion: 30,
    diaPago: 28,
    esperado: true // Debe aparecer como anticipado
  },
  {
    nombre: 'Cliente que paga día 30',
    diaFacturacion: 30,
    diaPago: 30,
    esperado: false // NO debe aparecer (pagó exacto)
  },
  {
    nombre: 'Cliente FAC-2025-00041 (ejemplo)',
    diaFacturacion: 30,
    diaPago: 22, // Asumiendo que pagó hoy
    esperado: true // Debe aparecer como anticipado
  }
];

console.log('=== VERIFICACIÓN DE LÓGICA DE PAGOS ANTICIPADOS ===\n');
console.log('Fecha de hoy:', hoy.toISOString().split('T')[0]);
console.log('Día de hoy:', hoy.getDate(), '\n');

casos.forEach(caso => {
  const esAnticipado = caso.diaPago < caso.diaFacturacion;
  const resultado = esAnticipado === caso.esperado ? '✅' : '❌';
  
  console.log(`${resultado} ${caso.nombre}`);
  console.log(`   Día de pago: ${caso.diaPago}`);
  console.log(`   Día de facturación: ${caso.diaFacturacion}`);
  console.log(`   ¿Es anticipado?: ${esAnticipado ? 'SÍ' : 'NO'}`);
  console.log(`   Esperado: ${caso.esperado ? 'Debe aparecer' : 'NO debe aparecer'}`);
  console.log('');
});

console.log('\n=== ANÁLISIS DEL PROBLEMA ===');
console.log('Si la factura FAC-2025-00041 fue pagada HOY (22 de diciembre)');
console.log('y el cliente tiene día de facturación 30,');
console.log('entonces: 22 < 30 = TRUE, DEBE APARECER\n');

console.log('Posibles razones por las que NO aparece:');
console.log('1. ❌ El cliente NO tiene suscripciones activas');
console.log('2. ❌ El pago NO está confirmado (estado diferente de "confirmado")');
console.log('3. ❌ El pago NO tiene facturaId asociado');
console.log('4. ❌ La fecha del pago no es de este año (2025)');
console.log('5. ❌ El cliente no tiene el campo clienteId en el pago');
