import { Request, Response } from 'express';
import { MovimientoKardex, Producto, TipoMovimientoKardex, Usuario, Almacen } from '../models';
import { Op } from 'sequelize';

export const getMovimientosKardex = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      producto_id, 
      almacen_id, 
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
      search = ''
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (producto_id) {
      whereClause.producto_id = producto_id;
    }

    if (almacen_id) {
      whereClause.almacen_id = almacen_id;
    }

    if (tipo_movimiento) {
      whereClause.tipo_movimiento = tipo_movimiento;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_movimiento = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { documento_referencia: { [Op.like]: `%${search}%` } },
        { numero_documento: { [Op.like]: `%${search}%` } },
        { observaciones: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: movimientos } = await MovimientoKardex.findAndCountAll({
      where: whereClause,
      include: [
        { model: Producto, as: 'producto' },
        { model: Almacen, as: 'almacen' },
        { model: Usuario, as: 'usuario' }
      ],
      limit: Number(limit),
      offset,
      order: [['fecha_movimiento', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        movimientos,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos KARDEX:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getMovimientoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const movimiento = await MovimientoKardex.findByPk(id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Almacen, as: 'almacen' },
        { model: Usuario, as: 'usuario' }
      ]
    });

    if (!movimiento) {
      res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getKardexProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { producto_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    const whereClause: any = {
      producto_id: Number(producto_id)
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_movimiento = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    const movimientos = await MovimientoKardex.findAll({
      where: whereClause,
      include: [
        { model: Producto, as: 'producto' },
        { model: Almacen, as: 'almacen' },
        { model: Usuario, as: 'usuario' }
      ],
      order: [['fecha_movimiento', 'ASC']]
    });

    // Calcular resumen
    const resumen = {
      total_entradas: 0,
      total_salidas: 0,
      stock_inicial: 0,
      stock_final: 0,
      valor_total_entradas: 0,
      valor_total_salidas: 0
    };

    if (movimientos.length > 0) {
      resumen.stock_inicial = movimientos[0].stock_anterior;
      resumen.stock_final = movimientos[movimientos.length - 1].stock_nuevo;

      movimientos.forEach(mov => {
        if (mov.tipo_movimiento.includes('ENTRADA')) {
          resumen.total_entradas += Number(mov.cantidad);
          resumen.valor_total_entradas += Number(mov.costo_total);
        } else if (mov.tipo_movimiento.includes('SALIDA')) {
          resumen.total_salidas += Number(mov.cantidad);
          resumen.valor_total_salidas += Number(mov.costo_total);
        }
      });
    }

    res.json({
      success: true,
      data: {
        movimientos,
        resumen
      }
    });
  } catch (error) {
    console.error('Error al obtener KARDEX del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createMovimientoManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      producto_id,
      almacen_id,
      tipo_movimiento,
      cantidad,
      precio_unitario,
      documento_referencia,
      numero_documento,
      fecha_movimiento,
      observaciones,
      motivo_movimiento
    } = req.body;

    const usuario_id = (req as any).user?.id;

    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    const stock_anterior = producto.stock_actual;
    let stock_nuevo = stock_anterior;

    // Determinar si es entrada o salida
    const esEntrada = tipo_movimiento.includes('ENTRADA');
    const esSalida = tipo_movimiento.includes('SALIDA');

    if (esEntrada) {
      stock_nuevo = stock_anterior + cantidad;
    } else if (esSalida) {
      stock_nuevo = stock_anterior - cantidad;
      if (stock_nuevo < 0) {
        res.status(400).json({
          success: false,
          message: 'No hay suficiente stock para realizar este movimiento'
        });
        return;
      }
    }

    // Crear el movimiento
    const movimiento = await MovimientoKardex.create({
      producto_id,
      almacen_id: almacen_id || 1,
      tipo_movimiento,
      cantidad,
      precio_unitario,
      costo_total: cantidad * precio_unitario,
      stock_anterior,
      stock_nuevo,
      documento_referencia,
      numero_documento,
      fecha_movimiento: fecha_movimiento || new Date(),
      usuario_id,
      observaciones,
      motivo_movimiento,
      estado_movimiento: 'APROBADO'
    });

    // Actualizar stock del producto
    await producto.update({ stock_actual: stock_nuevo });

    res.status(201).json({
      success: true,
      data: movimiento,
      message: 'Movimiento creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear movimiento manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getTiposMovimiento = async (req: Request, res: Response): Promise<void> => {
  try {
    const tipos = await TipoMovimientoKardex.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('Error al obtener tipos de movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getResumenKardex = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const whereClause: any = {};
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_movimiento = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    const movimientos = await MovimientoKardex.findAll({
      where: whereClause,
      include: [{ model: Producto, as: 'producto' }]
    });

    const resumen = {
      total_movimientos: movimientos.length,
      total_entradas: 0,
      total_salidas: 0,
      valor_total_entradas: 0,
      valor_total_salidas: 0,
      productos_afectados: new Set<number>(),
      tipos_movimiento: {} as Record<string, number>
    };

    movimientos.forEach(mov => {
      resumen.productos_afectados.add(mov.producto_id);
      
      if (!resumen.tipos_movimiento[mov.tipo_movimiento]) {
        resumen.tipos_movimiento[mov.tipo_movimiento] = 0;
      }
      resumen.tipos_movimiento[mov.tipo_movimiento]++;

      if (mov.tipo_movimiento.includes('ENTRADA')) {
        resumen.total_entradas += Number(mov.cantidad);
        resumen.valor_total_entradas += Number(mov.costo_total);
      } else if (mov.tipo_movimiento.includes('SALIDA')) {
        resumen.total_salidas += Number(mov.cantidad);
        resumen.valor_total_salidas += Number(mov.costo_total);
      }
    });

    const productosAfectadosCount = resumen.productos_afectados.size;

    res.json({
      success: true,
      data: {
        ...resumen,
        productos_afectados: productosAfectadosCount
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen KARDEX:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};