#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para corregir las referencias de modelo 'banco' por 'bank' en bankService.js
 */

function fixBankModel() {
    console.log('🔧 Corrigiendo referencias del modelo Bank en bankService.js...');
    
    const filePath = path.join(__dirname, 'server/services/bankService.js');
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo bankService.js no encontrado');
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let replacements = 0;
    
    // Patrones de reemplazo específicos para bankService.js
    const replacementPatterns = [
        // Cambiar prisma.banco por prisma.bank
        { 
            pattern: /prisma\.banco\./g, 
            replacement: 'prisma.bank.',
            description: 'prisma.banco.* → prisma.bank.*'
        },
        // Corregir métodos que no tienen el modelo especificado
        { 
            pattern: /await prisma\.findUnique\(/g, 
            replacement: 'await prisma.bank.findUnique(',
            description: 'prisma.findUnique() → prisma.bank.findUnique()'
        },
        { 
            pattern: /await prisma\.create\(/g, 
            replacement: 'await prisma.bank.create(',
            description: 'prisma.create() → prisma.bank.create()'
        },
        { 
            pattern: /await prisma\.update\(/g, 
            replacement: 'await prisma.bank.update(',
            description: 'prisma.update() → prisma.bank.update()'
        },
        { 
            pattern: /await prisma\.findMany\(\s*{\s*where:\s*{\s*bankId:\s*id\s*}/g, 
            replacement: 'await prisma.cuentaBancaria.findMany({\n        where: { bankId: id }',
            description: 'Agregar modelo cuentaBancaria donde falta'
        },
        { 
            pattern: /await prisma\.count\(\s*{\s*where:\s*{\s*bankId:\s*id/g, 
            replacement: 'await prisma.cuentaBancaria.count({\n        where: { bankId: id',
            description: 'Agregar modelo cuentaBancaria para count'
        },
        { 
            pattern: /await prisma\.count\(\s*{\s*where:\s*{\s*bankId:\s*id\s*}\s*}\)/g, 
            replacement: 'await prisma.movimientoContable.count({\n        where: { bankId: id }\n      })',
            description: 'Agregar modelo movimientoContable para count de movimientos'
        },
        { 
            pattern: /await prisma\.findMany\(\s*{\s*where:\s*{\s*bankId\s*}\s*}\)/g, 
            replacement: 'await prisma.cuentaBancaria.findMany({\n        where: { bankId }\n      })',
            description: 'Agregar modelo cuentaBancaria para findMany por bankId'
        },
        { 
            pattern: /await prisma\.findMany\(\s*{\s*where:\s*{\s*cuentaBancariaId:/g, 
            replacement: 'await prisma.pagoCliente.findMany({\n        where: { cuentaBancariaId:',
            description: 'Agregar modelo pagoCliente para pagos de clientes'
        }
    ];
    
    // Aplicar reemplazos
    replacementPatterns.forEach(({ pattern, replacement, description }) => {
        const matches = content.match(pattern);
        if (matches) {
            content = content.replace(pattern, replacement);
            replacements += matches.length;
            console.log(`✅ ${matches.length}x ${description}`);
        }
    });
    
    // Escribir archivo corregido
    if (replacements > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${replacements} correcciones aplicadas en ${filePath}`);
    } else {
        console.log('ℹ️ No se encontraron patrones para corregir');
    }
    
    console.log('🎉 Corrección de modelo Bank completada');
}

// Ejecutar script
fixBankModel();