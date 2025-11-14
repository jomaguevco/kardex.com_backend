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

    // Limpiar comentarios del SQL
    const cleanedSQL = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');

    // Dividir por statements (separados por ;)
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        if (!stmt) return false;
        // Permitir ALTER, CREATE, INSERT, UPDATE, DELETE
        const upper = stmt.toUpperCase();
        return upper.startsWith('ALTER') || 
               upper.startsWith('CREATE') || 
               upper.startsWith('INSERT') ||
               upper.startsWith('UPDATE') ||
               upper.startsWith('DELETE');
      });

    console.log(`📝 Ejecutando ${statements.length} statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      
      try {
        await connection.execute(statement);
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
        successCount++;
      } catch (error: any) {
        if (
          error.message.includes('Duplicate column name') ||
          error.message.includes('already exists') ||
          (error.message.includes('Table') && error.message.includes('already exists'))
        ) {
          console.log(`⚠️  [${i + 1}/${statements.length}] Ya existe: ${preview}...`);
          skipCount++;
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
          console.error(`   Statement: ${preview}...`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Exitosos:  ${successCount}`);
    console.log(`⚠️  Saltados:  ${skipCount}`);
    console.log(`❌ Errores:   ${errorCount}`);
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

    // Verificar columnas críticas
    console.log('\n🔍 Verificando columnas críticas...\n');
    
    const [columns]: any = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME IN ('rol', 'es_cliente_publico')
      ORDER BY COLUMN_NAME
    `);

    console.log('📋 Columnas en tabla usuarios:');
    if (Array.isArray(columns) && columns.length > 0) {
      columns.forEach((col: any) => {
        console.log(`   ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } else {
      console.warn('   ⚠️  No se encontraron las columnas esperadas');
    }

    const hasEsClientePublico = columns.some((col: any) => col.COLUMN_NAME === 'es_cliente_publico');
    
    if (hasEsClientePublico) {
      console.log('\n✨ Migración completada exitosamente en Railway!');
      console.log('🎯 El sistema de roles está listo para usarse.\n');
    } else {
      console.warn('\n⚠️  Advertencia: La columna es_cliente_publico no existe.');
      console.warn('💡 El servidor puede fallar al iniciar. Verifica la migración.\n');
    }

    await connection.end();
    process.exit(errorCount > 0 || !hasEsClientePublico ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    await connection.end();
    process.exit(1);
  }
}

migrateProduction();

