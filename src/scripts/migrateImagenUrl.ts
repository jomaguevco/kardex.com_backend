import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para agregar la columna imagen_url a la tabla productos en Railway
 */
async function migrateImagenUrl() {
  let connection: mysql.Connection | null = null;

  try {
    console.log('🚀 Iniciando migración de columna imagen_url...\n');

    // Obtener credenciales de Railway desde variables de entorno
    const dbConfig = {
      host: process.env.DB_HOST || 'shortline.proxy.rlwy.net',
      port: parseInt(process.env.DB_PORT || '43112'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'xYAOlvsfKbmcuSSDTOFJZmFBxpBVMHOI',
      database: process.env.DB_NAME || 'railway'
    };

    console.log('📡 Conectando a Railway MySQL...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}\n`);

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida\n');

    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna imagen_url ya existe...');
    const [columns]: any = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'productos'
        AND COLUMN_NAME = 'imagen_url'
    `);

    if (columns.length > 0) {
      console.log('⚠️  La columna imagen_url ya existe en la tabla productos');
      console.log('✅ No se requiere migración\n');
      await connection.end();
      process.exit(0);
    }

    console.log('📝 La columna no existe, procediendo con la migración...\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'addImagenUrlColumn.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Ejecutar la migración
    console.log('⚙️  Ejecutando ALTER TABLE...');
    await connection.execute(sqlContent);
    console.log('✅ Columna imagen_url agregada exitosamente\n');

    // Verificar que se creó correctamente
    console.log('🔍 Verificando columna creada...');
    const [verifyColumns]: any = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'productos'
        AND COLUMN_NAME = 'imagen_url'
    `);

    if (verifyColumns.length > 0) {
      const col = verifyColumns[0];
      console.log('✅ Verificación exitosa:');
      console.log(`   Columna: ${col.COLUMN_NAME}`);
      console.log(`   Tipo: ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})`);
      console.log(`   Nullable: ${col.IS_NULLABLE}\n`);
    }

    console.log('='.repeat(60));
    console.log('✨ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Ejecutar migración
migrateImagenUrl();

