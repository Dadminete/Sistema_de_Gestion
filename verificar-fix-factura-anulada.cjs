// Script para verificar el fix de facturas anuladas
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function verificarFacturaAnulada() {
    try {
        console.log('\n=== VERIFICANDO FIX DE FACTURA ANULADA ===\n');
        
        // 1. Obtener información del cliente que tiene la factura FAC-2025-00061
        console.log('1. Buscando cliente con factura FAC-2025-00061...');
        
        // Primero necesitamos saber qué cliente tiene esta factura
        const facturaResponse = await axios.get(`${API_URL}/facturas?limit=1000`);
        const factura00061 = facturaResponse.data.facturas.find(f => f.numeroFactura === 'FAC-2025-00061');
        
        if (!factura00061) {
            console.log('❌ No se encontró la factura FAC-2025-00061');
            return;
        }
        
        console.log('✅ Factura encontrada:');
        console.log('   - Número:', factura00061.numeroFactura);
        console.log('   - Cliente ID:', factura00061.clienteId);
        console.log('   - Estado en BD:', factura00061.estado);
        console.log('   - Cliente:', factura00061.cliente?.nombre, factura00061.cliente?.apellidos);
        
        // 2. Obtener información de facturas del cliente usando el endpoint que tiene el fix
        console.log('\n2. Obteniendo información de facturas del cliente...');
        const clienteId = factura00061.clienteId;
        const infoResponse = await axios.get(`${API_URL}/clientes/${clienteId}/invoices-info`);
        
        console.log('\n✅ Respuesta del endpoint /invoices-info:');
        
        // Buscar nuestra factura en la última factura
        if (infoResponse.data.ultimaFactura?.numeroFactura === 'FAC-2025-00061') {
            console.log('\n📋 Última Factura (FAC-2025-00061):');
            console.log('   - Estado:', infoResponse.data.ultimaFactura.estado);
            console.log('   - Estado Real:', infoResponse.data.ultimaFactura.estadoReal);
            
            if (infoResponse.data.ultimaFactura.estadoReal === 'anulada') {
                console.log('   ✅ ¡FIX EXITOSO! La factura ahora muestra estado "anulada"');
            } else {
                console.log('   ❌ ERROR: La factura debería mostrar estado "anulada" pero muestra:', infoResponse.data.ultimaFactura.estadoReal);
            }
        }
        
        // Buscar en facturas pendientes (no debería estar aquí)
        const enPendientes = infoResponse.data.facturasPendientes.find(f => f.numeroFactura === 'FAC-2025-00061');
        if (enPendientes) {
            console.log('\n❌ ERROR: La factura anulada aparece en facturasPendientes');
            console.log('   - Estado Real:', enPendientes.estadoReal);
        } else {
            console.log('\n✅ Correcto: La factura anulada NO aparece en facturasPendientes');
        }
        
        console.log('\n' + '='.repeat(50));
        
    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

verificarFacturaAnulada();
