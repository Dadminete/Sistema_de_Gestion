const NEON_API_ENDPOINT = 'https://ep-long-bread-a49wf2dl.apirest.us-east-1.aws.neon.tech/neondb/rest/v1';

async function consultaNeon(query, params = []) {
  const response = await fetch(`${NEON_API_ENDPOINT}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      query,
      params
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error en consulta: ${response.status} - ${response.statusText}`);
  }
  
  return await response.json();
}

async function diagnosticarCajas() {
  try {
    console.log('=== DIAGNÓSTICO URGENTE DE CAJAS ===\n');

    // 1. Estado de las cajas
    console.log('1. ESTADO ACTUAL DE CAJAS:');
    const cajasResult = await consultaNeon(
      "SELECT id, nombre, saldo_inicial, activa, cuenta_contable_id, created_at FROM cajas ORDER BY nombre"
    );
    
    console.log('Cajas encontradas:');
    for (const caja of cajasResult.rows) {
      console.log(`- ${caja[1]} (ID: ${caja[0]})`);
      console.log(`  Saldo inicial: ${caja[2]}`);
      console.log(`  Activa: ${caja[3]}`);
      console.log(`  Cuenta contable ID: ${caja[4]}`);
      console.log('');
    }

    // 2. Estado de las cuentas contables relacionadas con cajas
    console.log('\n2. CUENTAS CONTABLES RELACIONADAS:');
    const cuentasResult = await consultaNeon(
      "SELECT id, nombre, saldo_inicial, saldo_actual, activa FROM cuentas_contables WHERE nombre ILIKE '%caja%' OR nombre ILIKE '%papeleria%' ORDER BY nombre"
    );
    
    console.log('Cuentas contables de caja/papelería:');
    for (const cuenta of cuentasResult.rows) {
      console.log(`- ${cuenta[1]} (ID: ${cuenta[0]})`);
      console.log(`  Saldo inicial: ${cuenta[2]}`);
      console.log(`  Saldo actual: ${cuenta[3]}`);
      console.log(`  Activa: ${cuenta[4]}`);
      console.log('');
    }

    // 3. Últimos movimientos en apertura/cierre de cajas
    console.log('\n3. ÚLTIMOS MOVIMIENTOS DE APERTURA/CIERRE:');
    const movimientosResult = await consultaNeon(`
      SELECT 
        ac.id, ac.tipo, ac.monto_inicial, ac.monto_final, ac.diferencia,
        ac.estado, ac.fecha_apertura, ac.fecha_cierre, ac.observaciones,
        c.nombre as caja_nombre, u.nombre as usuario_nombre
      FROM apertura_cierre_cajas ac
      LEFT JOIN cajas c ON ac.caja_id = c.id
      LEFT JOIN usuarios u ON ac.usuario_id::text = u.id
      ORDER BY ac.fecha_apertura DESC
      LIMIT 10
    `);
    
    console.log('Últimos movimientos de apertura/cierre:');
    for (const mov of movimientosResult.rows) {
      console.log(`- ${mov[1]} en ${mov[9]} (${new Date(mov[6]).toLocaleString()})`);
      console.log(`  Monto inicial: ${mov[2]}`);
      console.log(`  Monto final: ${mov[3]}`);
      console.log(`  Diferencia: ${mov[4]}`);
      console.log(`  Estado: ${mov[5]}`);
      if (mov[8]) console.log(`  Observaciones: ${mov[8]}`);
      console.log('');
    }

    // 4. Verificar saldos calculados vs reales
    console.log('\n4. ANÁLISIS DETALLADO POR CAJA:');
    
    for (const caja of cajasResult.rows) {
      const cajaId = caja[0];
      const cajaNombre = caja[1];
      const saldoInicial = parseFloat(caja[2] || 0);
      
      console.log(`\n--- Análisis de ${cajaNombre} ---`);
      console.log(`Saldo inicial: ${saldoInicial}`);
      
      // Pagos de clientes
      const pagosResult = await consultaNeon(`
        SELECT COUNT(*), COALESCE(SUM(monto::numeric), 0) 
        FROM pagos_clientes 
        WHERE caja_id = $1 AND estado != 'anulado'
      `, [cajaId]);
      
      const totalPagos = parseFloat(pagosResult.rows[0][1] || 0);
      console.log(`Total pagos: ${totalPagos} (${pagosResult.rows[0][0]} registros)`);
      
      // Ventas de papelería
      const ventasResult = await consultaNeon(`
        SELECT COUNT(*), COALESCE(SUM(total::numeric), 0) 
        FROM ventas_papeleria 
        WHERE caja_id = $1 AND estado != 'anulada'
      `, [cajaId]);
      
      const totalVentas = parseFloat(ventasResult.rows[0][1] || 0);
      console.log(`Total ventas: ${totalVentas} (${ventasResult.rows[0][0]} registros)`);
      
      // Asientos contables
      const asientosResult = await consultaNeon(`
        SELECT COALESCE(SUM((debe::numeric) - (haber::numeric)), 0)
        FROM detalles_asientos da
        JOIN asientos a ON da.asiento_id = a.id
        WHERE da.caja_id = $1 AND a.estado = 'contabilizado'
      `, [cajaId]);
      
      const totalAsientos = parseFloat(asientosResult.rows[0][0] || 0);
      console.log(`Total asientos: ${totalAsientos}`);
      
      const balanceCalculado = saldoInicial + totalPagos + totalVentas + totalAsientos;
      console.log(`Balance calculado: ${balanceCalculado}`);
      
      // Verificar si hay movimientos contables asociados
      const movContablesResult = await consultaNeon(`
        SELECT COUNT(*), COALESCE(SUM(
          CASE WHEN tipo = 'ingreso' THEN monto::numeric 
               ELSE -monto::numeric END
        ), 0)
        FROM movimientos_contables 
        WHERE metodo = 'caja'
      `);
      
      if (movContablesResult.rows[0][0] > 0) {
        const totalMovContables = parseFloat(movContablesResult.rows[0][1] || 0);
        console.log(`Movimientos contables de caja: ${totalMovContables} (${movContablesResult.rows[0][0]} registros)`);
      }
    }

    // 5. Verificar el último evento que pudo causar el problema
    console.log('\n\n5. EVENTOS RECIENTES QUE PODRÍAN CAUSAR EL PROBLEMA:');
    
    const eventosRecientes = await consultaNeon(`
      SELECT 'apertura_cierre' as tipo, fecha_apertura as fecha, 
             CONCAT('Apertura/Cierre de ', c.nombre, ' - Diferencia: ', diferencia) as descripcion
      FROM apertura_cierre_cajas ac
      JOIN cajas c ON ac.caja_id = c.id
      WHERE ac.fecha_apertura > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 'pago_cliente' as tipo, fecha_pago as fecha,
             CONCAT('Pago cliente - Monto: ', monto, ' - Caja: ', c.nombre) as descripcion
      FROM pagos_clientes pc
      JOIN cajas c ON pc.caja_id = c.id
      WHERE pc.fecha_pago > NOW() - INTERVAL '24 hours'
      
      UNION ALL
      
      SELECT 'venta_papeleria' as tipo, fecha_venta as fecha,
             CONCAT('Venta papelería - Total: ', total, ' - Caja: ', c.nombre) as descripcion
      FROM ventas_papeleria vp
      JOIN cajas c ON vp.caja_id = c.id
      WHERE vp.fecha_venta > NOW() - INTERVAL '24 hours'
      
      ORDER BY fecha DESC
      LIMIT 20
    `);
    
    console.log('Eventos de las últimas 24 horas:');
    for (const evento of eventosRecientes.rows) {
      console.log(`- ${new Date(evento[1]).toLocaleString()}: ${evento[2]}`);
    }

  } catch (error) {
    console.error('Error en diagnóstico:', error);
  }
}

diagnosticarCajas();