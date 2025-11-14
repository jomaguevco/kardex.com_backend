import sequelize from '../config/database';
import Producto from '../models/Producto';
import Categoria from '../models/Categoria';
import Marca from '../models/Marca';

/**
 * Script para agregar productos con imágenes al catálogo
 */
async function seedProductos() {
  try {
    console.log('🌱 Iniciando seed de productos con imágenes...\n');

    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida\n');

    // Verificar/crear categorías
    const [categoriaElectronica] = await Categoria.findOrCreate({
      where: { nombre: 'Electrónica' },
      defaults: {
        nombre: 'Electrónica',
        descripcion: 'Productos electrónicos y tecnología',
        activo: true
      }
    });

    const [categoriaRopa] = await Categoria.findOrCreate({
      where: { nombre: 'Ropa y Accesorios' },
      defaults: {
        nombre: 'Ropa y Accesorios',
        descripcion: 'Ropa, calzado y accesorios',
        activo: true
      }
    });

    const [categoriaHogar] = await Categoria.findOrCreate({
      where: { nombre: 'Hogar y Cocina' },
      defaults: {
        nombre: 'Hogar y Cocina',
        descripcion: 'Artículos para el hogar y cocina',
        activo: true
      }
    });

    const [categoriaDeportes] = await Categoria.findOrCreate({
      where: { nombre: 'Deportes' },
      defaults: {
        nombre: 'Deportes',
        descripcion: 'Artículos deportivos y fitness',
        activo: true
      }
    });

    console.log('✅ Categorías creadas/verificadas\n');

    // Verificar/crear marcas
    const [marcaSamsung] = await Marca.findOrCreate({
      where: { nombre: 'Samsung' },
      defaults: { nombre: 'Samsung', activo: true }
    });

    const [marcaApple] = await Marca.findOrCreate({
      where: { nombre: 'Apple' },
      defaults: { nombre: 'Apple', activo: true }
    });

    const [marcaNike] = await Marca.findOrCreate({
      where: { nombre: 'Nike' },
      defaults: { nombre: 'Nike', activo: true }
    });

    const [marcaAdidas] = await Marca.findOrCreate({
      where: { nombre: 'Adidas' },
      defaults: { nombre: 'Adidas', activo: true }
    });

    const [marcaSony] = await Marca.findOrCreate({
      where: { nombre: 'Sony' },
      defaults: { nombre: 'Sony', activo: true }
    });

    console.log('✅ Marcas creadas/verificadas\n');

    // Obtener unidad de medida "UNIDAD"
    const [unidadUnidad] = await sequelize.query(`
      SELECT id FROM unidades_medida WHERE nombre = 'UNIDAD' LIMIT 1
    `);
    const unidadMedidaId = (unidadUnidad as any[])[0]?.id || 1;

    console.log(`✅ Unidad de medida ID: ${unidadMedidaId}\n`);

    // Productos con imágenes de Unsplash (gratuitas y de alta calidad)
    const productos = [
      // Electrónica
      {
        codigo_interno: 'ELEC-001',
        nombre: 'Smartphone Samsung Galaxy S23',
        descripcion: 'Smartphone de última generación con cámara de 50MP, pantalla AMOLED de 6.1" y procesador Snapdragon 8 Gen 2',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaSamsung.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 650.00,
        precio_venta: 899.00,
        costo_promedio: 650.00,
        stock_actual: 25,
        stock_minimo: 5,
        stock_maximo: 100,
        punto_reorden: 10,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ELEC-002',
        nombre: 'iPhone 14 Pro',
        descripcion: 'iPhone 14 Pro con Dynamic Island, cámara de 48MP y chip A16 Bionic',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaApple.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 950.00,
        precio_venta: 1299.00,
        costo_promedio: 950.00,
        stock_actual: 15,
        stock_minimo: 3,
        stock_maximo: 50,
        punto_reorden: 5,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1592286927505-2fd0f2b14d86?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ELEC-003',
        nombre: 'Laptop Dell XPS 15',
        descripcion: 'Laptop profesional con Intel Core i7, 16GB RAM, SSD 512GB y pantalla 4K',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaSamsung.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 1200.00,
        precio_venta: 1599.00,
        costo_promedio: 1200.00,
        stock_actual: 10,
        stock_minimo: 2,
        stock_maximo: 30,
        punto_reorden: 5,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ELEC-004',
        nombre: 'Audífonos Sony WH-1000XM5',
        descripcion: 'Audífonos inalámbricos con cancelación de ruido premium y 30 horas de batería',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaSony.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 280.00,
        precio_venta: 399.00,
        costo_promedio: 280.00,
        stock_actual: 40,
        stock_minimo: 10,
        stock_maximo: 80,
        punto_reorden: 15,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ELEC-005',
        nombre: 'Tablet iPad Air',
        descripcion: 'iPad Air con chip M1, pantalla Liquid Retina de 10.9" y 256GB',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaApple.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 550.00,
        precio_venta: 749.00,
        costo_promedio: 550.00,
        stock_actual: 20,
        stock_minimo: 5,
        stock_maximo: 50,
        punto_reorden: 10,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',
        activo: true
      },

      // Ropa y Accesorios
      {
        codigo_interno: 'ROPA-001',
        nombre: 'Zapatillas Nike Air Max',
        descripcion: 'Zapatillas deportivas con tecnología Air Max para máxima comodidad',
        categoria_id: categoriaRopa.id,
        marca_id: marcaNike.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 80.00,
        precio_venta: 129.00,
        costo_promedio: 80.00,
        stock_actual: 50,
        stock_minimo: 15,
        stock_maximo: 100,
        punto_reorden: 20,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ROPA-002',
        nombre: 'Camiseta Adidas Deportiva',
        descripcion: 'Camiseta deportiva con tecnología Climalite para absorción de humedad',
        categoria_id: categoriaRopa.id,
        marca_id: marcaAdidas.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 20.00,
        precio_venta: 35.00,
        costo_promedio: 20.00,
        stock_actual: 100,
        stock_minimo: 30,
        stock_maximo: 200,
        punto_reorden: 40,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ROPA-003',
        nombre: 'Mochila Nike Deportiva',
        descripcion: 'Mochila espaciosa con múltiples compartimentos y diseño ergonómico',
        categoria_id: categoriaRopa.id,
        marca_id: marcaNike.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 35.00,
        precio_venta: 59.00,
        costo_promedio: 35.00,
        stock_actual: 30,
        stock_minimo: 10,
        stock_maximo: 60,
        punto_reorden: 15,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
        activo: true
      },

      // Hogar y Cocina
      {
        codigo_interno: 'HOGAR-001',
        nombre: 'Cafetera Espresso',
        descripcion: 'Cafetera automática con 15 bares de presión y espumador de leche',
        categoria_id: categoriaHogar.id,
        marca_id: marcaSamsung.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 180.00,
        precio_venta: 279.00,
        costo_promedio: 180.00,
        stock_actual: 15,
        stock_minimo: 5,
        stock_maximo: 40,
        punto_reorden: 8,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'HOGAR-002',
        nombre: 'Licuadora de Alta Potencia',
        descripcion: 'Licuadora profesional de 1200W con jarra de vidrio de 2 litros',
        categoria_id: categoriaHogar.id,
        marca_id: marcaSony.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 90.00,
        precio_venta: 149.00,
        costo_promedio: 90.00,
        stock_actual: 25,
        stock_minimo: 8,
        stock_maximo: 50,
        punto_reorden: 12,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=500&q=80',
        activo: true
      },

      // Deportes
      {
        codigo_interno: 'DEP-001',
        nombre: 'Balón de Fútbol Adidas',
        descripcion: 'Balón oficial de fútbol con tecnología de precisión y durabilidad',
        categoria_id: categoriaDeportes.id,
        marca_id: marcaAdidas.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 25.00,
        precio_venta: 45.00,
        costo_promedio: 25.00,
        stock_actual: 60,
        stock_minimo: 20,
        stock_maximo: 120,
        punto_reorden: 30,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aae?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'DEP-002',
        nombre: 'Pesas Ajustables 20kg',
        descripcion: 'Set de pesas ajustables de 5 a 20kg con sistema de cambio rápido',
        categoria_id: categoriaDeportes.id,
        marca_id: marcaNike.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 120.00,
        precio_venta: 189.00,
        costo_promedio: 120.00,
        stock_actual: 18,
        stock_minimo: 5,
        stock_maximo: 40,
        punto_reorden: 8,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'DEP-003',
        nombre: 'Esterilla de Yoga Premium',
        descripcion: 'Esterilla antideslizante de 6mm con bolsa de transporte incluida',
        categoria_id: categoriaDeportes.id,
        marca_id: marcaAdidas.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 18.00,
        precio_venta: 32.00,
        costo_promedio: 18.00,
        stock_actual: 45,
        stock_minimo: 15,
        stock_maximo: 90,
        punto_reorden: 20,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80',
        activo: true
      },

      // Más productos electrónicos
      {
        codigo_interno: 'ELEC-006',
        nombre: 'Smartwatch Samsung Galaxy Watch',
        descripcion: 'Reloj inteligente con monitoreo de salud, GPS y resistencia al agua',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaSamsung.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 220.00,
        precio_venta: 329.00,
        costo_promedio: 220.00,
        stock_actual: 30,
        stock_minimo: 8,
        stock_maximo: 60,
        punto_reorden: 12,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
        activo: true
      },
      {
        codigo_interno: 'ELEC-007',
        nombre: 'Cámara Digital Sony Alpha',
        descripcion: 'Cámara mirrorless de 24MP con video 4K y lente 18-55mm',
        categoria_id: categoriaElectronica.id,
        marca_id: marcaSony.id,
        unidad_medida_id: unidadMedidaId,
        precio_compra: 850.00,
        precio_venta: 1199.00,
        costo_promedio: 850.00,
        stock_actual: 8,
        stock_minimo: 2,
        stock_maximo: 20,
        punto_reorden: 4,
        tiene_caducidad: false,
        dias_caducidad: 0,
        imagen_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80',
        activo: true
      }
    ];

    console.log(`📦 Creando ${productos.length} productos...\n`);

    let createdCount = 0;
    let existingCount = 0;

    for (const productoData of productos) {
      const [producto, created] = await Producto.findOrCreate({
        where: { codigo_interno: productoData.codigo_interno },
        defaults: productoData
      });

      if (created) {
        console.log(`✅ Creado: ${producto.nombre} (${producto.codigo_interno})`);
        createdCount++;
      } else {
        console.log(`⚠️  Ya existe: ${producto.nombre} (${producto.codigo_interno})`);
        existingCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Productos creados: ${createdCount}`);
    console.log(`⚠️  Productos existentes: ${existingCount}`);
    console.log(`📝 Total procesados: ${productos.length}`);
    console.log('='.repeat(60));

    console.log('\n✨ Seed completado exitosamente!');
    console.log('🛍️  El catálogo ahora tiene productos con imágenes.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedProductos();

