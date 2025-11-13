import sequelize from '../config/database';

async function migrateUserProfile() {
  try {
    console.log('🚀 Ejecutando migración para agregar campos de perfil...\n');

    // Agregar campo foto_perfil
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN foto_perfil VARCHAR(500) NULL AFTER telefono;
      `);
      console.log('✅ Campo foto_perfil agregado');
    } catch (error: any) {
      if (error.original?.errno === 1060) {
        console.log('ℹ️  Campo foto_perfil ya existe');
      } else {
        throw error;
      }
    }

    // Agregar campo preferencias
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN preferencias TEXT NULL AFTER telefono;
      `);
      console.log('✅ Campo preferencias agregado');
    } catch (error: any) {
      if (error.original?.errno === 1060) {
        console.log('ℹ️  Campo preferencias ya existe');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Campos de perfil verificados/agregados a la tabla usuarios\n');
    
    // Crear tabla notificaciones
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo ENUM('STOCK_BAJO', 'COMPRA_PENDIENTE', 'VENTA_PENDIENTE', 'TRANSACCION', 'SISTEMA') NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        leido BOOLEAN DEFAULT FALSE,
        referencia_id INT NULL,
        referencia_tipo VARCHAR(50) NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_leido (leido),
        INDEX idx_tipo (tipo),
        INDEX idx_fecha_creacion (fecha_creacion)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Tabla notificaciones verificada/creada\n');

    console.log('✅ Migración completada exitosamente!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  }
}

migrateUserProfile();

