import sequelize from '../config/database';

/**
 * Script para agregar imágenes placeholder a productos sin imagen
 */
async function updateProductosImagenes() {
  try {
    console.log('🖼️  Iniciando actualización de imágenes de productos...\n');

    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida\n');

    // Imagen placeholder de alta calidad (producto genérico)
    const imagenPlaceholder = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';

    // Actualizar productos sin imagen
    const [result]: any = await sequelize.query(`
      UPDATE productos 
      SET imagen_url = '${imagenPlaceholder}'
      WHERE imagen_url IS NULL OR imagen_url = '' OR TRIM(imagen_url) = ''
    `);

    const productosActualizados = result.affectedRows || 0;

    console.log('📊 RESUMEN:');
    console.log(`✅ Productos actualizados: ${productosActualizados}`);
    console.log(`🖼️  Imagen placeholder: ${imagenPlaceholder}\n`);

    if (productosActualizados > 0) {
      console.log('✨ Actualización completada exitosamente!');
    } else {
      console.log('ℹ️  No se encontraron productos sin imagen.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la actualización:', error);
    process.exit(1);
  }
}

// Ejecutar actualización
updateProductosImagenes();

