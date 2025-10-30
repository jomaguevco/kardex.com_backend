import { Request, Response } from 'express';
import { Proveedor } from '../models';
import { Op } from 'sequelize';

export const getProveedores = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      activo: true
    };

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { telefono: { [Op.like]: `%${search}%` } },
        { numero_documento: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: proveedores } = await Proveedor.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        proveedores,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getProveedorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      codigo,
      nombre,
      tipo_documento,
      numero_documento,
      direccion,
      telefono,
      email,
      contacto,
      tipo_proveedor
    } = req.body;

    // Verificar si el número de documento ya existe
    if (numero_documento) {
      const existingProveedor = await Proveedor.findOne({
        where: { numero_documento }
      });

      if (existingProveedor) {
        res.status(400).json({
          success: false,
          message: 'El número de documento ya existe'
        });
        return;
      }
    }

    // Verificar si el email ya existe
    if (email) {
      const existingEmail = await Proveedor.findOne({
        where: { email }
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'El email ya existe'
        });
        return;
      }
    }

    // Generar código único para el proveedor si no se proporciona
    const codigoProveedor = codigo || `PROV-${Date.now()}`;

    const proveedor = await Proveedor.create({
      codigo: codigoProveedor,
      nombre: nombre || 'Proveedor',
      numero_documento: numero_documento || '',
      tipo_documento: tipo_documento || 'RUC',
      email,
      telefono,
      direccion,
      contacto,
      tipo_proveedor: tipo_proveedor || 'NACIONAL'
    });

    res.status(201).json({
      success: true,
      data: proveedor,
      message: 'Proveedor creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    // Verificar campos únicos si se están actualizando
    if (updateData.numero_documento && updateData.numero_documento !== proveedor.numero_documento) {
      const existingProveedor = await Proveedor.findOne({
        where: { numero_documento: updateData.numero_documento }
      });

      if (existingProveedor) {
        res.status(400).json({
          success: false,
          message: 'El RUC ya existe'
        });
        return;
      }
    }

    if (updateData.email && updateData.email !== proveedor.email) {
      const existingEmail = await Proveedor.findOne({
        where: { email: updateData.email }
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'El email ya existe'
        });
        return;
      }
    }

    await proveedor.update(updateData);

    res.json({
      success: true,
      data: proveedor,
      message: 'Proveedor actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.findByPk(id);

    if (!proveedor) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    // Soft delete - marcar como inactivo
    await proveedor.update({ activo: false });

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getProveedoresActivos = async (req: Request, res: Response): Promise<void> => {
  try {
    const proveedores = await Proveedor.findAll({
      where: { activo: true },
      attributes: ['id', 'codigo', 'nombre', 'tipo_documento', 'numero_documento', 'direccion', 'telefono', 'email', 'contacto', 'tipo_proveedor'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: proveedores
    });
  } catch (error) {
    console.error('Error al obtener proveedores activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

