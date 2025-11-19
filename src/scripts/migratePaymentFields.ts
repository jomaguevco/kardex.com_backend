import sequelize from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Script para ejecutar la migración de campos de pago en pedidos
 */
async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de campos de pago...\n');

    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'add-payment-fields-pedidos.sql');
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
        return true;
      });

    console.log(`📝 Ejecutando ${statements.length} statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      
      try {
        console.log(`[${i + 1}/${statements.length}] Ejecutando: ${preview}...`);
        await sequelize.query(statement);
        console.log(`✅ Ejecutado correctamente\n`);
        successCount++;
      } catch (error: any) {
        // Algunos errores son aceptables (por ejemplo, columna ya existe)
        if (
          error.message.includes('Duplicate column name') ||
          error.message.includes('already exists') ||
          error.message.includes('Duplicate entry') ||
          (error.message.includes('Column') && error.message.includes('already exists'))
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

    console.log('\n🎉 Migración completada!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigration();
}

export default runMigration;

