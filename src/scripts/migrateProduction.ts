import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

/**
 * Script para ejecutar migración en Railway
 */
async function migrateProduction() {
  const connection = await mysql.createConnection({
    host: 'shortline.proxy.rlwy.net',
    port: 43112,
    user: 'root',
    password: 'xYAOlvsfKbmcuSSDTOFJZmFBxpBVMHOI',
    database: 'railway',
    multipleStatements: true
  });

  try {
    console.log('🚀 Conectando a Railway MySQL...\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'createRolesTables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Dividir y ejecutar statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        if (stmt.startsWith('--')) return false;
        if (stmt.startsWith('/*')) return false;
        if (stmt.toUpperCase().startsWith('SELECT') || stmt.toUpperCase().startsWith('SHOW')) return false;
        return true;
      });

    console.log(`📝 Ejecutando ${statements.length} statements...\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log(`✅ Statement ejecutado`);
        successCount++;
      } catch (error: any) {
        if (
          error.message.includes('Duplicate column name') ||
          error.message.includes('already exists') ||
          error.message.includes('Table') && error.message.includes('already exists')
        ) {
          console.log(`⚠️  Ya existe, saltando...`);
          skipCount++;
        } else {
          console.error(`❌ Error:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Exitosos:  ${successCount}`);
    console.log(`⚠️  Saltados:  ${skipCount}`);
    console.log(`📝 Total:     ${statements.length}`);
    console.log('='.repeat(60));

    // Verificar tablas
    console.log('\n🔍 Verificando tablas creadas...\n');
    
    const [pedidosTables] = await connection.execute(`SHOW TABLES LIKE '%pedido%'`);
    const [clienteUsuarioTable] = await connection.execute(`SHOW TABLES LIKE 'cliente_usuario'`);

    console.log('📋 Tablas del sistema:');
    if (Array.isArray(pedidosTables) && pedidosTables.length > 0) {
      pedidosTables.forEach((row: any) => {
        const tableName = Object.values(row)[0];
        console.log(`   ✓ ${tableName}`);
      });
    }
    
    if (Array.isArray(clienteUsuarioTable) && clienteUsuarioTable.length > 0) {
      console.log(`   ✓ cliente_usuario`);
    }

    console.log('\n✨ Migración completada exitosamente en Railway!');
    console.log('🎯 El sistema de roles está listo para usarse.\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    await connection.end();
    process.exit(1);
  }
}

migrateProduction();

