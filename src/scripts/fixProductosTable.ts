import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

export const fixProductosTable = async () => {
  try {
    console.log('🔧 Verificando y corrigiendo tabla productos...');

    // Verificar si la columna dias_caducidad permite NULL
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'productos'
      AND COLUMN_NAME = 'dias_caducidad'
    `, { type: QueryTypes.SELECT }) as any[];

    if (columns && columns.length > 0 && columns[0].IS_NULLABLE === 'NO') {
      console.log('⚠️ La columna dias_caducidad no permite NULL, corrigiendo...');
      
      // Alterar la columna para permitir NULL
      await sequelize.query(`
        ALTER TABLE productos 
        MODIFY COLUMN dias_caducidad INT NULL DEFAULT 0
      `);
      
      console.log('✅ Columna dias_caducidad actualizada para permitir NULL');
    } else {
      console.log('✅ La columna dias_caducidad ya permite NULL');
    }
  } catch (error) {
    console.error('⚠️ Error al verificar/corregir tabla productos:', error);
    // No lanzamos error para no romper el inicio del servidor
  }
};

