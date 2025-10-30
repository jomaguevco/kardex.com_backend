import { Request, Response } from 'express';
import { Producto, Categoria, Marca, UnidadMedida, MovimientoKardex } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', categoria_id, marca_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      activo: true
    };

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo_interno: { [Op.like]: `%${search}%` } },
        { codigo_barras: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoria_id) {
      whereClause.categoria_id = categoria_id;
    }

    if (marca_id) {
      whereClause.marca_id = marca_id;
    }

    const { count, rows: productos } = await Producto.findAndCountAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' },
        { model: UnidadMedida, as: 'unidadMedida' }
      ],
      limit: Number(limit),
      offset,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        productos,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getProductoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' },
        { model: UnidadMedida, as: 'unidadMedida' },
        { 
          model: MovimientoKardex, 
          as: 'movimientosKardex',
          limit: 10,
          order: [['fecha_movimiento', 'DESC']]
        }
      ]
    });

    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: producto
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      codigo_barras,
      codigo_interno,
      nombre,
      descripcion,
      categoria_id,
      marca_id,
      unidad_medida_id,
      precio_venta,
      costo_promedio,
      precio_compra,
      stock_minimo,
      stock_maximo,
      punto_reorden,
      stock_actual,
      peso,
      volumen,
      dimensiones,
      tiene_caducidad,
      dias_caducidad
    } = req.body;

    // Verificar si el código interno ya existe
    const existingProducto = await Producto.findOne({
      where: { codigo_interno }
    });

    if (existingProducto) {
      res.status(400).json({
        success: false,
        message: 'El código interno ya existe'
      });
      return;
    }

    // Verificar si el código de barras ya existe (si se proporciona)
    if (codigo_barras) {
      const existingBarcode = await Producto.findOne({
        where: { codigo_barras }
      });

      if (existingBarcode) {
        res.status(400).json({
          success: false,
          message: 'El código de barras ya existe'
        });
        return;
      }
    }

    const producto = await Producto.create({
      codigo_barras,
      codigo_interno,
      nombre,
      descripcion,
      categoria_id,
      marca_id,
      unidad_medida_id,
      precio_venta: precio_venta || 0,
      costo_promedio: costo_promedio || 0,
      precio_compra: precio_compra || 0,
      stock_minimo: stock_minimo || 0,
      stock_maximo: stock_maximo || 0,
      punto_reorden: punto_reorden || 0,
      stock_actual: stock_actual || 0,
      peso: peso || 0,
      volumen: volumen || 0,
      dimensiones,
      tiene_caducidad: tiene_caducidad || false,
      dias_caducidad: dias_caducidad || null
    });

    res.status(201).json({
      success: true,
      data: producto,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    // Verificar códigos únicos si se están actualizando
    if (updateData.codigo_interno && updateData.codigo_interno !== producto.codigo_interno) {
      const existingProducto = await Producto.findOne({
        where: { codigo_interno: updateData.codigo_interno }
      });

      if (existingProducto) {
        res.status(400).json({
          success: false,
          message: 'El código interno ya existe'
        });
        return;
      }
    }

    if (updateData.codigo_barras && updateData.codigo_barras !== producto.codigo_barras) {
      const existingBarcode = await Producto.findOne({
        where: { codigo_barras: updateData.codigo_barras }
      });

      if (existingBarcode) {
        res.status(400).json({
          success: false,
          message: 'El código de barras ya existe'
        });
        return;
      }
    }

    await producto.update(updateData);

    res.json({
      success: true,
      data: producto,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    // Soft delete - marcar como inactivo
    await producto.update({ activo: false });

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const ajustarStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cantidad, motivo, observaciones } = req.body;
    const usuario_id = (req as any).user?.id;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    const stock_anterior = producto.stock_actual;
    const stock_nuevo = stock_anterior + cantidad;

    if (stock_nuevo < 0) {
      res.status(400).json({
        success: false,
        message: 'No se puede ajustar el stock a un valor negativo'
      });
      return;
    }

    // Actualizar stock del producto
    await producto.update({ stock_actual: stock_nuevo });

    // Crear movimiento en KARDEX
    const tipo_movimiento = cantidad > 0 ? 'ENTRADA_AJUSTE_POSITIVO' : 'SALIDA_AJUSTE_NEGATIVO';

    await MovimientoKardex.create({
      producto_id: producto.id,
      almacen_id: 1, // Almacén principal por defecto
      tipo_movimiento,
      cantidad: Math.abs(cantidad),
      precio_unitario: producto.costo_promedio,
      costo_total: Math.abs(cantidad) * producto.costo_promedio,
      stock_anterior,
      stock_nuevo,
      documento_referencia: 'AJUSTE_MANUAL',
      numero_documento: `AJ-${Date.now()}`,
      fecha_movimiento: new Date(),
      usuario_id,
      observaciones,
      motivo_movimiento: motivo,
      estado_movimiento: 'APROBADO'
    });

    res.json({
      success: true,
      data: {
        producto,
        movimiento: {
          stock_anterior,
          stock_nuevo,
          cantidad_ajustada: cantidad
        }
      },
      message: 'Stock ajustado exitosamente'
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getProductosStockBajo = async (req: Request, res: Response): Promise<void> => {
  try {
    const productos = await Producto.findAll({
      where: {
        activo: true,
        stock_actual: {
          [Op.lte]: sequelize.col('stock_minimo')
        }
      },
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Marca, as: 'marca' }
      ],
      order: [['stock_actual', 'ASC']]
    });

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};