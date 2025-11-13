import sequelize from '../config/database';
import { Producto, MovimientoKardex, Compra, Venta, DetalleCompra, DetalleVenta, Usuario, Almacen } from '../models';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

export const seedKardexMovimientos = async () => {
  try {
    console.log('🚀 Iniciando seed de movimientos KARDEX...\n');

    // Obtener datos existentes
    const productos = await Producto.findAll({ where: { activo: true } });
    const usuarios = await Usuario.findAll();
    const almacenes = await Almacen.findAll();
    const almacen = almacenes[0] || await Almacen.create({
      codigo: 'ALM-001',
      nombre: 'Almacén Principal',
      direccion: 'Lima - Perú',
      activo: true
    });

    const usuario = usuarios[0];

    if (!usuario) {
      console.error('❌ No hay usuarios en el sistema');
      return;
    }

    console.log(`📦 Procesando ${productos.length} productos...\n`);

    let totalMovimientos = 0;

    // 1. MOVIMIENTOS DE INVENTARIO INICIAL
    console.log('1️⃣  Creando movimientos de inventario inicial...');
    for (const producto of productos) {
      const fechaInicial = new Date();
      fechaInicial.setDate(fechaInicial.getDate() - 150); // Hace 150 días

      const stockInicial = producto.stock_actual > 0 ? randomInt(5, producto.stock_actual + 20) : randomInt(10, 50);

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'ENTRADA_AJUSTE_POSITIVO',
        cantidad: stockInicial,
        precio_unitario: producto.precio_compra,
        costo_total: stockInicial * producto.precio_compra,
        stock_anterior: 0,
        stock_nuevo: stockInicial,
        documento_referencia: `INV-INICIAL-${producto.codigo_interno}`,
        fecha_movimiento: fechaInicial,
        usuario_id: usuario.id,
        observaciones: 'Inventario inicial del sistema',
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productos.length} movimientos de inventario inicial creados\n`);

    // 2. MOVIMIENTOS BASADOS EN COMPRAS EXISTENTES
    console.log('2️⃣  Creando movimientos basados en compras...');
    const compras = await Compra.findAll({
      where: { estado: 'PROCESADA' },
      include: [{ model: DetalleCompra, as: 'detalles' }],
      order: [['fecha_compra', 'ASC']]
    });

    for (const compra of compras) {
      for (const detalle of (compra as any).detalles) {
        const producto = productos.find(p => p.id === detalle.producto_id);
        if (!producto) continue;

        // Obtener el último movimiento del producto
        const ultimoMovimiento = await MovimientoKardex.findOne({
          where: { producto_id: producto.id },
          order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
        });

        const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
        const stockNuevo = stockAnterior + detalle.cantidad;

        await MovimientoKardex.create({
          producto_id: producto.id,
          almacen_id: almacen.id,
          tipo_movimiento: 'ENTRADA_COMPRA',
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          costo_total: detalle.subtotal,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          documento_referencia: `COMPRA-${compra.numero_factura}`,
          numero_documento: compra.numero_factura,
          fecha_movimiento: compra.fecha_compra,
          usuario_id: usuario.id,
          observaciones: `Compra ${compra.numero_factura}`,
          estado_movimiento: 'APROBADO'
        });

        totalMovimientos++;
      }
    }
    console.log(`   ✅ ${compras.length} compras procesadas\n`);

    // 3. MOVIMIENTOS BASADOS EN VENTAS EXISTENTES
    console.log('3️⃣  Creando movimientos basados en ventas...');
    const ventas = await Venta.findAll({
      where: { estado: 'PROCESADA' },
      include: [{ model: DetalleVenta, as: 'detalles' }],
      order: [['fecha_venta', 'ASC']]
    });

    for (const venta of ventas) {
      for (const detalle of (venta as any).detalles) {
        const producto = productos.find(p => p.id === detalle.producto_id);
        if (!producto) continue;

        // Obtener el último movimiento del producto
        const ultimoMovimiento = await MovimientoKardex.findOne({
          where: { producto_id: producto.id },
          order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
        });

        const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
        const stockNuevo = Math.max(0, stockAnterior - detalle.cantidad);

        await MovimientoKardex.create({
          producto_id: producto.id,
          almacen_id: almacen.id,
          tipo_movimiento: 'SALIDA_VENTA',
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          costo_total: detalle.subtotal,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          documento_referencia: `VENTA-${venta.numero_factura}`,
          numero_documento: venta.numero_factura,
          fecha_movimiento: venta.fecha_venta,
          usuario_id: usuario.id,
          observaciones: `Venta ${venta.numero_factura}`,
          estado_movimiento: 'APROBADO'
        });

        totalMovimientos++;
      }
    }
    console.log(`   ✅ ${ventas.length} ventas procesadas\n`);

    // 4. DEVOLUCIONES DE CLIENTES
    console.log('4️⃣  Creando devoluciones de clientes...');
    const productosDevolucion = productos.slice(0, 15); // Primeros 15 productos
    for (const producto of productosDevolucion) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - randomInt(10, 60));

      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
      const cantidad = randomInt(1, 5);
      const stockNuevo = stockAnterior + cantidad;

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'ENTRADA_DEVOLUCION_CLIENTE',
        cantidad,
        precio_unitario: producto.precio_venta,
        costo_total: cantidad * producto.precio_venta,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        documento_referencia: `DEV-CLI-${String(randomInt(1000, 9999))}`,
        fecha_movimiento: fecha,
        usuario_id: usuario.id,
        observaciones: 'Devolución de cliente por garantía/cambio',
        motivo_movimiento: 'Producto defectuoso o cambio por el cliente',
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productosDevolucion.length} devoluciones de clientes creadas\n`);

    // 5. DEVOLUCIONES A PROVEEDORES
    console.log('5️⃣  Creando devoluciones a proveedores...');
    const productosDevProveedor = productos.slice(15, 25);
    for (const producto of productosDevProveedor) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - randomInt(20, 80));

      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
      const cantidad = randomInt(1, 3);
      const stockNuevo = Math.max(0, stockAnterior - cantidad);

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'SALIDA_DEVOLUCION_PROVEEDOR',
        cantidad,
        precio_unitario: producto.precio_compra,
        costo_total: cantidad * producto.precio_compra,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        documento_referencia: `DEV-PROV-${String(randomInt(1000, 9999))}`,
        fecha_movimiento: fecha,
        usuario_id: usuario.id,
        observaciones: 'Devolución a proveedor',
        motivo_movimiento: 'Producto defectuoso o no conforme',
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productosDevProveedor.length} devoluciones a proveedores creadas\n`);

    // 6. AJUSTES DE INVENTARIO (POSITIVOS)
    console.log('6️⃣  Creando ajustes positivos de inventario...');
    const productosAjustePos = productos.slice(25, 40);
    for (const producto of productosAjustePos) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - randomInt(5, 45));

      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
      const cantidad = randomInt(1, 10);
      const stockNuevo = stockAnterior + cantidad;

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'ENTRADA_AJUSTE_POSITIVO',
        cantidad,
        precio_unitario: producto.precio_compra,
        costo_total: cantidad * producto.precio_compra,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        documento_referencia: `AJU-POS-${String(randomInt(1000, 9999))}`,
        fecha_movimiento: fecha,
        usuario_id: usuario.id,
        observaciones: 'Ajuste positivo de inventario',
        motivo_movimiento: 'Productos encontrados en inventario físico',
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productosAjustePos.length} ajustes positivos creados\n`);

    // 7. AJUSTES DE INVENTARIO (NEGATIVOS)
    console.log('7️⃣  Creando ajustes negativos de inventario...');
    const productosAjusteNeg = productos.slice(40, 50);
    for (const producto of productosAjusteNeg) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - randomInt(5, 45));

      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
      const cantidad = randomInt(1, 5);
      const stockNuevo = Math.max(0, stockAnterior - cantidad);

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'SALIDA_AJUSTE_NEGATIVO',
        cantidad,
        precio_unitario: producto.precio_compra,
        costo_total: cantidad * producto.precio_compra,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        documento_referencia: `AJU-NEG-${String(randomInt(1000, 9999))}`,
        fecha_movimiento: fecha,
        usuario_id: usuario.id,
        observaciones: 'Ajuste negativo de inventario',
        motivo_movimiento: 'Diferencia encontrada en conteo físico',
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productosAjusteNeg.length} ajustes negativos creados\n`);

    // 8. MERMAS
    console.log('8️⃣  Creando mermas...');
    const productosMerma = productos.slice(50, 65);
    for (const producto of productosMerma) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - randomInt(10, 90));

      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      const stockAnterior = ultimoMovimiento?.stock_nuevo || 0;
      const cantidad = randomInt(1, 3);
      const stockNuevo = Math.max(0, stockAnterior - cantidad);

      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: almacen.id,
        tipo_movimiento: 'SALIDA_MERMA',
        cantidad,
        precio_unitario: producto.precio_compra,
        costo_total: cantidad * producto.precio_compra,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        documento_referencia: `MERMA-${String(randomInt(1000, 9999))}`,
        fecha_movimiento: fecha,
        usuario_id: usuario.id,
        observaciones: 'Merma de producto',
        motivo_movimiento: ['Daño', 'Obsolescencia', 'Vencimiento', 'Rotura'][randomInt(0, 3)],
        estado_movimiento: 'APROBADO'
      });

      totalMovimientos++;
    }
    console.log(`   ✅ ${productosMerma.length} mermas creadas\n`);

    // 9. ACTUALIZAR STOCK ACTUAL DE PRODUCTOS
    console.log('9️⃣  Actualizando stock actual de productos...');
    for (const producto of productos) {
      const ultimoMovimiento = await MovimientoKardex.findOne({
        where: { producto_id: producto.id },
        order: [['fecha_movimiento', 'DESC'], ['id', 'DESC']]
      });

      if (ultimoMovimiento) {
        await producto.update({ stock_actual: ultimoMovimiento.stock_nuevo });
      }
    }
    console.log(`   ✅ Stock actualizado para todos los productos\n`);

    console.log('✅ Seed de movimientos KARDEX completado exitosamente!\n');
    console.log('📊 RESUMEN:');
    console.log(`   - Total de movimientos creados: ${totalMovimientos}`);
    console.log(`   - Productos procesados: ${productos.length}`);
    console.log(`   - Movimientos por producto (promedio): ${(totalMovimientos / productos.length).toFixed(2)}`);
    console.log('\n🎉 Base de datos de KARDEX completa!\n');

  } catch (error) {
    console.error('❌ Error en el seed de KARDEX:', error);
    throw error;
  }
};

// Si se ejecuta directamente
if (require.main === module) {
  seedKardexMovimientos()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

