import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Venta from '../models/Venta';
import Compra from '../models/Compra';
import Producto from '../models/Producto';
import MovimientoKardex from '../models/MovimientoKardex';
import Cliente from '../models/Cliente';
import Proveedor from '../models/Proveedor';
import DetalleVenta from '../models/DetalleVenta';
import TipoMovimientoKardex from '../models/TipoMovimientoKardex';

export const getReporteVentas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin, cliente_id, estado } = req.query;
    
    const whereClause: any = {
      estado: 'PROCESADA'
    };

    // Filtro por fechas
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    // Filtro por cliente
    if (cliente_id) {
      whereClause.cliente_id = cliente_id;
    }

    // Filtro por estado
    if (estado) {
      whereClause.estado = estado;
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['fecha_venta', 'DESC']]
    });

    // Calcular estadísticas
    const totalVentas = ventas.reduce((sum, venta) => sum + Number(venta.total), 0);
    const cantidadVentas = ventas.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    // Ventas por día
    const ventasPorDia = ventas.reduce((acc: any, venta) => {
      const fecha = new Date(venta.fecha_venta).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, cantidad: 0, total: 0 };
      }
      acc[fecha].cantidad += 1;
      acc[fecha].total += Number(venta.total);
      return acc;
    }, {});

    const ventasPorDiaArray = Object.values(ventasPorDia).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    res.json({
      success: true,
      data: {
        ventas,
        estadisticas: {
          total_ventas: totalVentas,
          cantidad_ventas: cantidadVentas,
          promedio_venta: promedioVenta
        },
        ventas_por_dia: ventasPorDiaArray
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getReporteCompras = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin, proveedor_id, estado } = req.query;
    
    const whereClause: any = {
      estado: 'PROCESADA'
    };

    // Filtro por fechas
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_compra = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    // Filtro por proveedor
    if (proveedor_id) {
      whereClause.proveedor_id = proveedor_id;
    }

    // Filtro por estado
    if (estado) {
      whereClause.estado = estado;
    }

    const compras = await Compra.findAll({
      where: whereClause,
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['fecha_compra', 'DESC']]
    });

    // Calcular estadísticas
    const totalCompras = compras.reduce((sum, compra) => sum + Number(compra.total), 0);
    const cantidadCompras = compras.length;
    const promedioCompra = cantidadCompras > 0 ? totalCompras / cantidadCompras : 0;

    // Compras por día
    const comprasPorDia = compras.reduce((acc: any, compra) => {
      const fecha = new Date(compra.fecha_compra).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, cantidad: 0, total: 0 };
      }
      acc[fecha].cantidad += 1;
      acc[fecha].total += Number(compra.total);
      return acc;
    }, {});

    const comprasPorDiaArray = Object.values(comprasPorDia).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    res.json({
      success: true,
      data: {
        compras,
        estadisticas: {
          total_compras: totalCompras,
          cantidad_compras: cantidadCompras,
          promedio_compra: promedioCompra
        },
        compras_por_dia: comprasPorDiaArray
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de compras:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getReporteInventario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria_id, marca_id, stock_bajo } = req.query;
    
    const whereClause: any = {
      activo: true
    };

    // Filtro por categoría
    if (categoria_id) {
      whereClause.categoria_id = categoria_id;
    }

    // Filtro por marca
    if (marca_id) {
      whereClause.marca_id = marca_id;
    }

    // Filtro por stock bajo
    if (stock_bajo === 'true') {
      whereClause[Op.and] = [
        { stock_actual: { [Op.lte]: sequelize.col('stock_minimo') } }
      ];
    }

    const productos = await Producto.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    // Calcular estadísticas
    const totalProductos = productos.length;
    const valorTotalInventario = productos.reduce((sum, producto) => 
      sum + (Number(producto.stock_actual) * Number(producto.precio_compra)), 0
    );
    const productosStockBajo = productos.filter(producto => 
      producto.stock_actual <= producto.stock_minimo
    ).length;

    // Productos por categoría
    const productosPorCategoria = productos.reduce((acc: any, producto) => {
      const categoria = `Categoría ${producto.categoria_id}`;
      if (!acc[categoria]) {
        acc[categoria] = { categoria, cantidad: 0, valor: 0 };
      }
      acc[categoria].cantidad += 1;
      acc[categoria].valor += Number(producto.stock_actual) * Number(producto.precio_compra);
      return acc;
    }, {});

    const productosPorCategoriaArray = Object.values(productosPorCategoria);

    res.json({
      success: true,
      data: {
        productos,
        estadisticas: {
          total_productos: totalProductos,
          valor_total_inventario: valorTotalInventario,
          productos_stock_bajo: productosStockBajo
        },
        productos_por_categoria: productosPorCategoriaArray
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getReporteRentabilidad = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    const whereClause: any = {
      estado: 'PROCESADA'
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    // Obtener ventas con detalles
    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              attributes: ['id', 'codigo_interno', 'nombre', 'precio_compra']
            }
          ]
        }
      ]
    });

    // Calcular rentabilidad por producto
    const rentabilidadPorProducto = new Map();
    
    ventas.forEach(venta => {
      const detalles = (venta as any).detalles;
      if (detalles && Array.isArray(detalles)) {
        detalles.forEach((detalle: any) => {
          const productoId = detalle.producto_id;
          const costo = Number(detalle.producto.precio_compra) * detalle.cantidad;
          const ingreso = detalle.subtotal;
          const ganancia = ingreso - costo;
          const margen = ingreso > 0 ? (ganancia / ingreso) * 100 : 0;

          if (!rentabilidadPorProducto.has(productoId)) {
            rentabilidadPorProducto.set(productoId, {
              producto: detalle.producto,
              cantidad_vendida: 0,
              costo_total: 0,
              ingreso_total: 0,
              ganancia_total: 0,
              margen_promedio: 0
            });
          }

          const producto = rentabilidadPorProducto.get(productoId);
          producto.cantidad_vendida += detalle.cantidad;
          producto.costo_total += costo;
          producto.ingreso_total += ingreso;
          producto.ganancia_total += ganancia;
          producto.margen_promedio = producto.ingreso_total > 0 ? 
            (producto.ganancia_total / producto.ingreso_total) * 100 : 0;
        });
      }
    });

    const rentabilidadArray = Array.from(rentabilidadPorProducto.values())
      .sort((a, b) => b.ganancia_total - a.ganancia_total);

    // Estadísticas generales
    const totalIngresos = rentabilidadArray.reduce((sum, item) => sum + item.ingreso_total, 0);
    const totalCostos = rentabilidadArray.reduce((sum, item) => sum + item.costo_total, 0);
    const gananciaTotal = totalIngresos - totalCostos;
    const margenGeneral = totalIngresos > 0 ? (gananciaTotal / totalIngresos) * 100 : 0;

    res.json({
      success: true,
      data: {
        rentabilidad_por_producto: rentabilidadArray,
        estadisticas_generales: {
          total_ingresos: totalIngresos,
          total_costos: totalCostos,
          ganancia_total: gananciaTotal,
          margen_general: margenGeneral
        }
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de rentabilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getReporteMovimientos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin, producto_id } = req.query;
    
    const whereClause: any = {};

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_movimiento = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (producto_id) {
      whereClause.producto_id = producto_id;
    }

    const movimientos = await MovimientoKardex.findAll({
      where: whereClause,
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'codigo', 'nombre']
        },
        {
          model: TipoMovimientoKardex,
          as: 'tipoMovimiento',
          attributes: ['id', 'nombre', 'tipo_operacion']
        }
      ],
      order: [['fecha_movimiento', 'DESC']]
    });

    // Estadísticas por tipo de movimiento
    const estadisticasPorTipo = movimientos.reduce((acc: any, movimiento) => {
      const tipoMovimiento = (movimiento as any).tipoMovimiento;
      const tipo = tipoMovimiento ? tipoMovimiento.nombre : (movimiento as any).tipo_movimiento || 'DESCONOCIDO';
      if (!acc[tipo]) {
        acc[tipo] = { cantidad: 0, total: 0 };
      }
      acc[tipo].cantidad += movimiento.cantidad;
      acc[tipo].total += Number(movimiento.costo_total || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        movimientos,
        estadisticas_por_tipo: estadisticasPorTipo
      }
    });
  } catch (error) {
    console.error('Error al generar reporte de movimientos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

