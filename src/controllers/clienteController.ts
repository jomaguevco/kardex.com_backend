import { Request, Response } from 'express';
import { Cliente } from '../models';
import { Op } from 'sequelize';

export const getClientes = async (req: Request, res: Response): Promise<void> => {
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

    const { count, rows: clientes } = await Cliente.findAndCountAll({
      where: whereClause,
      limit: Number(limit),
      offset,
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        clientes,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getClienteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombre,
      email,
      telefono,
      numero_documento,
      tipo_documento,
      direccion,
      contacto,
      tipo_cliente
    } = req.body;

    // Verificar si el número de documento ya existe
    if (numero_documento) {
      const existingCliente = await Cliente.findOne({
        where: { numero_documento }
      });

      if (existingCliente) {
        res.status(400).json({
          success: false,
          message: 'El número de documento ya existe'
        });
        return;
      }
    }

    // Verificar si el email ya existe
    if (email) {
      const existingEmail = await Cliente.findOne({
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

    // Generar código único para el cliente
    const codigo = `CLI-${Date.now()}`;

    const cliente = await Cliente.create({
      codigo,
      nombre,
      numero_documento: numero_documento || '',
      tipo_documento: tipo_documento || 'DNI',
      tipo_cliente: tipo_cliente || 'NATURAL',
      email,
      telefono,
      direccion,
      contacto
    });

    res.status(201).json({
      success: true,
      data: cliente,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
      return;
    }

    // Verificar documentos únicos si se están actualizando
    if (updateData.numero_documento && updateData.numero_documento !== cliente.numero_documento) {
      const existingCliente = await Cliente.findOne({
        where: { numero_documento: updateData.numero_documento }
      });

      if (existingCliente) {
        res.status(400).json({
          success: false,
          message: 'El número de documento ya existe'
        });
        return;
      }
    }

    if (updateData.email && updateData.email !== cliente.email) {
      const existingEmail = await Cliente.findOne({
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

    await cliente.update(updateData);

    res.json({
      success: true,
      data: cliente,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
      return;
    }

    // Soft delete - marcar como inactivo
    await cliente.update({ activo: false });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getClientesActivos = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientes = await Cliente.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre', 'email', 'telefono', 'numero_documento'],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: clientes || []
    });
  } catch (error: any) {
    console.error('Error al obtener clientes activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error?.message
    });
  }
};

