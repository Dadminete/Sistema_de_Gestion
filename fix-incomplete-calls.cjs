#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para corregir las llamadas a Prisma que no especifican el modelo
 * Identificará el contexto de cada llamada e inferirá el modelo correcto
 */

function fixIncompleteServiceCalls() {
    console.log('🔧 Corrigiendo llamadas incompletas a Prisma en servicios...');
    
    const servicesDir = path.join(__dirname, 'server/services');
    
    if (!fs.existsSync(servicesDir)) {
        console.log('❌ Directorio de servicios no encontrado');
        return;
    }
    
    const servicesToFix = [
        {
            file: 'vacacionService.js',
            patterns: [
                { 
                    search: 'await prisma.findMany({\\s*where: { activo: true }\\s*});',
                    replace: 'await prisma.tipoVacacion.findMany({\\s*where: { activo: true }\\s*});',
                    context: 'getAllTipos',
                    model: 'tipoVacacion'
                },
                {
                    search: 'await prisma.findMany({\\s*where: { empleadoId:',
                    replace: 'await prisma.periodoVacacion.findMany({\\s*where: { empleadoId:',
                    context: 'getPeriodosByEmpleado', 
                    model: 'periodoVacacion'
                },
                {
                    search: 'await prisma.create({\\s*data: {\\s*empleadoId:',
                    replace: 'await prisma.solicitudVacacion.create({\\s*data: {\\s*empleadoId:',
                    context: 'createSolicitud',
                    model: 'solicitudVacacion'
                }
            ]
        },
        {
            file: 'chatService.js', 
            patterns: [
                {
                    search: 'await prisma.findMany({',
                    replace: 'await prisma.chat.findMany({',
                    model: 'chat'
                }
            ]
        }
    ];
    
    let totalReplacements = 0;
    
    servicesToFix.forEach(({ file, patterns }) => {
        const filePath = path.join(servicesDir, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Archivo ${file} no encontrado, saltando...`);
            return;
        }
        
        console.log(`\\n📄 Procesando ${file}...`);
        let content = fs.readFileSync(filePath, 'utf8');
        let fileReplacements = 0;
        
        patterns.forEach(({ search, replace, context, model }) => {
            const regex = new RegExp(search, 'g');
            const matches = content.match(regex);
            
            if (matches) {
                content = content.replace(regex, replace);
                fileReplacements += matches.length;
                totalReplacements += matches.length;
                console.log(`  ✅ ${matches.length}x ${context || 'llamada'} → ${model}`);
            }
        });
        
        if (fileReplacements > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  📝 ${fileReplacements} correcciones aplicadas en ${file}`);
        } else {
            console.log(`  ℹ️ No se encontraron patrones para corregir en ${file}`);
        }
    });
    
    console.log(`\\n🎉 Total: ${totalReplacements} correcciones aplicadas`);
}

// Ejecutar script
fixIncompleteServiceCalls();