import sequelize from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Script para ejecutar la migración del sistema de roles
 * Crea las tablas necesarias para el sistema multi-rol
 */
async function runMigration() {
  try {
    console.log('🚀 Iniciando migración del sistema de roles...\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'createRolesTables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Dividir por línea y filtrar comentarios y líneas vacías
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Filtrar líneas vacías
        if (!stmt) return false;
        // Filtrar comentarios simples
        if (stmt.startsWith('--')) return false;
        // Filtrar comentarios de bloque
        if (stmt.startsWith('/*')) return false;
        // Filtrar SELECT de verificación
        if (stmt.toUpperCase().startsWith('SELECT') || stmt.toUpperCase().startsWith('SHOW')) return false;
        return true;
      });

    console.log(`📝 Se ejecutarán ${statements.length} statements SQL\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`[${i + 1}/${statements.length}] Ejecutando...`);
        
        // Determinar el tipo de statement
        let tipo = 'UNKNOWN';
        if (statement.toUpperCase().includes('ALTER TABLE')) tipo = 'ALTER';
        else if (statement.toUpperCase().includes('CREATE TABLE')) tipo = 'CREATE';
        else if (statement.toUpperCase().includes('INSERT')) tipo = 'INSERT';
        
        await sequelize.query(statement);
        
        console.log(`✅ [${tipo}] Ejecutado correctamente\n`);
        successCount++;
      } catch (error: any) {
        // Algunos errores son aceptables (por ejemplo, tabla ya existe)
        if (
          error.message.includes('Duplicate column name') ||
          error.message.includes('already exists') ||
          error.message.includes('Table') && error.message.includes('already exists')
        ) {
          console.log(`⚠️  Ya existe, saltando...\n`);
          skipCount++;
        } else {
          console.error(`❌ Error:`, error.message, '\n');
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

    // Verificar tablas creadas
    console.log('\n🔍 Verificando tablas creadas...');
    
    const [tables]: any = await sequelize.query(`SHOW TABLES LIKE '%pedido%'`);
    const [clienteUsuario]: any = await sequelize.query(`SHOW TABLES LIKE 'cliente_usuario'`);
    
    console.log('\n📋 Tablas del sistema de pedidos:');
    if (tables.length > 0) {
      tables.forEach((table: any) => {
        const tableName = Object.values(table)[0];
        console.log(`   ✓ ${tableName}`);
      });
    }
    
    if (clienteUsuario.length > 0) {
      console.log(`   ✓ cliente_usuario`);
    }

    // Verificar columnas de usuarios
    console.log('\n📋 Columnas agregadas a usuarios:');
    const [columns]: any = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuarios' 
        AND COLUMN_NAME IN ('rol', 'es_cliente_publico')
    `);
    
    columns.forEach((col: any) => {
      console.log(`   ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      if (col.COLUMN_COMMENT) {
        console.log(`     → ${col.COLUMN_COMMENT}`);
      }
    });

    if (errorCount === 0) {
      console.log('\n✨ Migración completada exitosamente!');
      console.log('💡 El sistema de roles está listo para usarse.\n');
    } else {
      console.log(`\n⚠️  Migración completada con ${errorCount} errores.`);
      console.log('💡 Revisa los errores anteriores para más detalles.\n');
    }

    process.exit(errorCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error fatal durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration();

