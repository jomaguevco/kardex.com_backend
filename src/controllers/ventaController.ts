import { Request, Response } from 'express';
import { Venta, DetalleVenta, Producto, Cliente, Usuario, MovimientoKardex } from '../models';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';

export const getVentas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', fecha_inicio, fecha_fin, cliente_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { numero_factura: { [Op.like]: `%${search}%` } }
      ];
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (cliente_id) {
      whereClause.cliente_id = cliente_id;
    }

    // Consulta simple primero para verificar si hay datos
    const { count, rows: ventas } = await Venta.findAndCountAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente', required: false },
        { model: Usuario, as: 'usuario', required: false },
        { 
          model: DetalleVenta, 
          as: 'detalles',
          required: false,
          include: [{ model: Producto, as: 'producto', required: false }]
        }
      ],
      limit: Number(limit),
      offset,
      order: [['fecha_venta', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        ventas: ventas || [],
        pagination: {
          total: count || 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error?.message
    });
  }
};

export const getVentaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { 
          model: DetalleVenta, 
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    if (!venta) {
      res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: venta
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createVenta = async (req: Request, res: Response): Promise<void> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const {
      cliente_id,
      numero_factura,
      fecha_venta,
      subtotal,
      descuento,
      impuestos,
      total,
      estado,
      observaciones,
      detalles
    } = req.body;

    const usuario_id = (req as any).user?.id;

    // Generar número de factura si no se proporciona
    const numeroFactura = numero_factura || `FAC-${Date.now()}`;

    // Convertir fecha_venta si viene como string ISO
    let fechaVenta = fecha_venta || new Date();
    if (typeof fechaVenta === 'string') {
      fechaVenta = new Date(fechaVenta);
    }

    // Crear la venta
    const venta = await Venta.create({
      cliente_id,
      numero_factura: numeroFactura,
      fecha_venta: fechaVenta,
      subtotal: subtotal || 0,
      descuento: descuento || 0,
      impuestos: impuestos || 0,
      total: total || 0,
      estado: estado || 'PROCESADA', // Por defecto PROCESADA ya que se actualiza stock y se crea movimiento KARDEX
      observaciones,
      usuario_id
    }, { transaction });

    // Crear los detalles de la venta
    const detallesVenta = [];
    for (const detalle of detalles) {
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      if (!producto) {
        throw new Error(`Producto con ID ${detalle.producto_id} no encontrado`);
      }

      if (producto.stock_actual < detalle.cantidad) {
        throw new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock disponible: ${producto.stock_actual}`);
      }

      const detalleVenta = await DetalleVenta.create({
        venta_id: venta.id,
        producto_id: detalle.producto_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento || 0,
        subtotal: detalle.cantidad * detalle.precio_unitario - (detalle.descuento || 0)
      }, { transaction });

      detallesVenta.push(detalleVenta);

      // Guardar stock anterior antes de actualizar
      const stockAnterior = producto.stock_actual;
      const nuevoStock = stockAnterior - detalle.cantidad;
      
      // Actualizar stock del producto
      await producto.update({ stock_actual: nuevoStock }, { transaction });

      // Crear movimiento en KARDEX
      // tipo_movimiento_id es opcional y referencia a tipos_movimiento_kardex, no a la venta
      // No lo incluimos porque es opcional y TypeScript no acepta null
      await MovimientoKardex.create({
        producto_id: producto.id,
        almacen_id: 1, // Almacén principal por defecto
        tipo_movimiento: 'SALIDA_VENTA',
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        costo_total: detalle.cantidad * producto.costo_promedio,
        stock_anterior: stockAnterior,
        stock_nuevo: nuevoStock,
        documento_referencia: 'VENTA',
        numero_documento: numeroFactura,
        fecha_movimiento: venta.fecha_venta,
        usuario_id,
        observaciones: `Venta ${numeroFactura}`,
        estado_movimiento: 'APROBADO'
      }, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: {
        venta,
        detalles: detallesVenta
      },
      message: 'Venta creada exitosamente'
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error al crear venta:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Error interno del servidor'
    });
  }
};

export const updateVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const venta = await Venta.findByPk(id);

    if (!venta) {
      res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
      return;
    }

    // Solo permitir actualizar ciertos campos
    const allowedFields = ['estado', 'observaciones', 'metodo_pago'];
    const filteredData: any = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    await venta.update(filteredData);

    res.json({
      success: true,
      data: venta,
      message: 'Venta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteVenta = async (req: Request, res: Response): Promise<void> => {
  const transaction: Transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id, {
      include: [{ model: DetalleVenta, as: 'detalles' }]
    });

    if (!venta) {
      res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
      return;
    }

    // Revertir movimientos de stock
    if (venta.detalles) {
      for (const detalle of venta.detalles) {
      const producto = await Producto.findByPk(detalle.producto_id, { transaction });
      
      if (producto) {
        const nuevoStock = producto.stock_actual + detalle.cantidad;
        await producto.update({ stock_actual: nuevoStock }, { transaction });

        // Crear movimiento de reversión en KARDEX
        await MovimientoKardex.create({
          producto_id: producto.id,
          almacen_id: 1,
          tipo_movimiento: 'ENTRADA_DEVOLUCION_CLIENTE',
          tipo_movimiento_id: venta.id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          costo_total: detalle.cantidad * producto.costo_promedio,
          stock_anterior: producto.stock_actual,
          stock_nuevo: nuevoStock,
          documento_referencia: 'ANULACION_VENTA',
          numero_documento: venta.numero_factura,
          fecha_movimiento: new Date(),
          usuario_id: (req as any).user?.id,
          observaciones: `Anulación de venta ${venta.numero_factura}`,
          estado_movimiento: 'APROBADO'
        }, { transaction });
      }
      }
    }

    // Eliminar detalles
    await DetalleVenta.destroy({
      where: { venta_id: id },
      transaction
    });

    // Eliminar venta
    await venta.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Venta eliminada exitosamente'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getEstadisticasVentas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const whereClause: any = {};
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      attributes: [
        'fecha_venta',
        'total',
        'subtotal',
        'descuento',
        'impuestos'
      ]
    });

    const estadisticas = {
      total_ventas: ventas.length,
      total_monto: ventas.reduce((sum, v) => sum + Number(v.total), 0),
      total_subtotal: ventas.reduce((sum, v) => sum + Number(v.subtotal), 0),
      total_descuentos: ventas.reduce((sum, v) => sum + Number(v.descuento), 0),
      total_impuestos: ventas.reduce((sum, v) => sum + Number(v.impuestos), 0),
      promedio_venta: ventas.length > 0 ? ventas.reduce((sum, v) => sum + Number(v.total), 0) / ventas.length : 0
    };

    res.json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};