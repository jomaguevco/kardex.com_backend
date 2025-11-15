import { Request, Response } from 'express';
import { MovimientoKardex, Producto, TipoMovimientoKardex, Usuario, Almacen } from '../models';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';

/**
 * Obtener tipos de movimiento disponibles para ajustes
 */
export const getTiposMovimiento = async (req: Request, res: Response): Promise<void> => {
  try {
    const tipos = await TipoMovimientoKardex.findAll({
      where: {
        activo: true,
        tipo_operacion: {
          [Op.in]: ['ENTRADA', 'SALIDA']
        }
      },
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
      message: 'Error al obtener tipos de movimiento',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Crear ajuste de inventario manual
 */
export const crearAjusteInventario = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const usuarioId = (req as any).user?.id;
    const {
      producto_id,
      almacen_id = 1, // Almacén principal por defecto
      tipo_movimiento,
      cantidad,
      precio_unitario,
      motivo_movimiento,
      observaciones,
      numero_documento,
      requiere_autorizacion = false
    } = req.body;

    if (!usuarioId) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Validaciones
    if (!producto_id || !tipo_movimiento || !cantidad) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'producto_id, tipo_movimiento y cantidad son requeridos'
      });
      return;
    }

    if (cantidad <= 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
      return;
    }

    // Obtener producto
    const producto = await Producto.findByPk(producto_id, { transaction });
    if (!producto) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    // Determinar tipo de movimiento basado en el string o buscar en TipoMovimientoKardex
    let tipoMovimiento = null;
    let esEntrada = false;
    let esSalida = false;
    let tipoMovimientoEnum: any = tipo_movimiento;

    // Si tipo_movimiento es un código, buscar en TipoMovimientoKardex
    if (tipo_movimiento && !tipo_movimiento.includes('ENTRADA') && !tipo_movimiento.includes('SALIDA')) {
      tipoMovimiento = await TipoMovimientoKardex.findOne({
        where: { codigo: tipo_movimiento, activo: true },
        transaction
      });

      if (!tipoMovimiento) {
        await transaction.rollback();
        res.status(404).json({
          success: false,
          message: 'Tipo de movimiento no encontrado o inactivo'
        });
        return;
      }

      esEntrada = tipoMovimiento.tipo_operacion === 'ENTRADA';
      esSalida = tipoMovimiento.tipo_operacion === 'SALIDA';
      
      // Mapear a enum según el tipo de operación
      if (esEntrada) {
        tipoMovimientoEnum = 'ENTRADA_AJUSTE_POSITIVO';
      } else if (esSalida) {
        tipoMovimientoEnum = 'SALIDA_AJUSTE_NEGATIVO';
      }
    } else {
      // Si viene como enum directo
      esEntrada = tipo_movimiento.includes('ENTRADA');
      esSalida = tipo_movimiento.includes('SALIDA');
      
      // Buscar tipo de movimiento por nombre si es posible
      const nombreBusqueda = tipo_movimiento.replace('_', ' ').toLowerCase();
      tipoMovimiento = await TipoMovimientoKardex.findOne({
        where: {
          activo: true,
          tipo_operacion: esEntrada ? 'ENTRADA' : 'SALIDA'
        },
        transaction
      });
    }

    if (!esEntrada && !esSalida) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Tipo de movimiento inválido para ajuste de inventario'
      });
      return;
    }

    // Calcular stock nuevo
    const stock_anterior = producto.stock_actual;
    const stock_nuevo = esEntrada 
      ? stock_anterior + cantidad 
      : stock_anterior - cantidad;

    // Validar que no quede stock negativo
    if (stock_nuevo < 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `No se puede realizar el ajuste. Stock actual: ${stock_anterior}, cantidad a descontar: ${cantidad}. Resultado sería negativo.`
      });
      return;
    }

    // Usar precio del producto si no se proporciona
    const precioFinal = precio_unitario || producto.costo_promedio || producto.precio_compra || 0;
    const costo_total = cantidad * precioFinal;

    // Determinar estado según si requiere autorización
    const estado_movimiento = (tipoMovimiento?.requiere_autorizacion || requiere_autorizacion) 
      ? 'PENDIENTE' 
      : 'APROBADO';

    // Si está aprobado, actualizar stock inmediatamente
    if (estado_movimiento === 'APROBADO') {
      await producto.update(
        { stock_actual: stock_nuevo },
        { transaction }
      );
    }

    // Crear movimiento KARDEX
    const movimiento = await MovimientoKardex.create({
      producto_id: producto.id,
      almacen_id,
      tipo_movimiento: tipoMovimientoEnum as any,
      tipo_movimiento_id: tipoMovimiento?.id,
      cantidad,
      precio_unitario: precioFinal,
      costo_total,
      stock_anterior,
      stock_nuevo,
      documento_referencia: 'AJUSTE_MANUAL',
      numero_documento: numero_documento || `AJ-${Date.now()}`,
      fecha_movimiento: new Date(),
      usuario_id: usuarioId,
      observaciones,
      motivo_movimiento,
      estado_movimiento
    }, { transaction });

    await transaction.commit();

    // Cargar relaciones para la respuesta
    const movimientoCompleto = await MovimientoKardex.findByPk(movimiento.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Almacen, as: 'almacen' },
        { model: Usuario, as: 'usuario' },
        { model: TipoMovimientoKardex, as: 'tipoMovimiento' }
      ]
    });

    res.status(201).json({
      success: true,
      message: estado_movimiento === 'APROBADO' 
        ? 'Ajuste de inventario realizado exitosamente' 
        : 'Ajuste de inventario creado, pendiente de aprobación',
      data: movimientoCompleto
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear ajuste de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear ajuste de inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener ajustes de inventario
 */
export const getAjustesInventario = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      producto_id,
      tipo_movimiento,
      estado_movimiento,
      fecha_inicio,
      fecha_fin,
      search = ''
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const whereClause: any = {
      documento_referencia: 'AJUSTE_MANUAL'
    };

    if (producto_id) {
      whereClause.producto_id = producto_id;
    }

    if (tipo_movimiento) {
      whereClause.tipo_movimiento = tipo_movimiento;
    }

    if (estado_movimiento) {
      whereClause.estado_movimiento = estado_movimiento;
    }

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_movimiento = {
        [Op.between]: [fecha_inicio, fecha_fin]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { numero_documento: { [Op.like]: `%${search}%` } },
        { observaciones: { [Op.like]: `%${search}%` } },
        { motivo_movimiento: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: movimientos } = await MovimientoKardex.findAndCountAll({
      where: whereClause,
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo_interno', 'codigo_barras'] },
        { model: Almacen, as: 'almacen', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre_completo', 'email'] },
        { model: Usuario, as: 'autorizadoPor', attributes: ['id', 'nombre_completo', 'email'], required: false },
        { model: TipoMovimientoKardex, as: 'tipoMovimiento', required: false }
      ],
      order: [['fecha_movimiento', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data: movimientos,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error al obtener ajustes de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ajustes de inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Aprobar ajuste de inventario
 */
export const aprobarAjusteInventario = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const usuarioId = (req as any).user?.id;
    const { id } = req.params;

    if (!usuarioId) {
      await transaction.rollback();
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const movimiento = await MovimientoKardex.findByPk(id, {
      include: [{ model: Producto, as: 'producto' }],
      transaction
    });

    if (!movimiento) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: 'Ajuste de inventario no encontrado'
      });
      return;
    }

    if (movimiento.estado_movimiento !== 'PENDIENTE') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `El ajuste ya está ${movimiento.estado_movimiento.toLowerCase()}`
      });
      return;
    }

    if (movimiento.documento_referencia !== 'AJUSTE_MANUAL') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Este movimiento no es un ajuste manual'
      });
      return;
    }

    // Actualizar stock del producto
    const movimientoConProducto = await MovimientoKardex.findByPk(id, {
      include: [{ model: Producto, as: 'producto' }],
      transaction
    });
    
    const producto = (movimientoConProducto as any)?.producto;
    if (producto) {
      await producto.update(
        { stock_actual: movimiento.stock_nuevo },
        { transaction }
      );
    }

    // Actualizar estado del movimiento
    await movimiento.update({
      estado_movimiento: 'APROBADO',
      autorizado_por: usuarioId,
      fecha_autorizacion: new Date()
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Ajuste de inventario aprobado exitosamente',
      data: movimiento
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al aprobar ajuste de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar ajuste de inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Rechazar ajuste de inventario
 */
export const rechazarAjusteInventario = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    const { id } = req.params;
    const { motivo_rechazo } = req.body;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const movimiento = await MovimientoKardex.findByPk(id);

    if (!movimiento) {
      res.status(404).json({
        success: false,
        message: 'Ajuste de inventario no encontrado'
      });
      return;
    }

    if (movimiento.estado_movimiento !== 'PENDIENTE') {
      res.status(400).json({
        success: false,
        message: `El ajuste ya está ${movimiento.estado_movimiento.toLowerCase()}`
      });
      return;
    }

    await movimiento.update({
      estado_movimiento: 'RECHAZADO',
      autorizado_por: usuarioId,
      fecha_autorizacion: new Date(),
      observaciones: motivo_rechazo 
        ? `${movimiento.observaciones || ''}\n\nRechazado: ${motivo_rechazo}`.trim()
        : movimiento.observaciones
    });

    res.json({
      success: true,
      message: 'Ajuste de inventario rechazado',
      data: movimiento
    });
  } catch (error) {
    console.error('Error al rechazar ajuste de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar ajuste de inventario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

