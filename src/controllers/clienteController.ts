import { Request, Response } from 'express';
import { Cliente, Venta } from '../models';
import { Op } from 'sequelize';
import { AuthRequest } from '../middleware/auth';

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

    // Verificar si el cliente tiene ventas asociadas
    const ventasCount = await Venta.count({
      where: { cliente_id: id }
    });

    if (ventasCount > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede eliminar el cliente porque tiene ${ventasCount} venta(s) registrada(s)`,
        data: {
          ventasCount
        }
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

/**
 * Obtener cliente por teléfono
 */
export const getClienteByPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params as { phone: string };
    const numero = (phone || '').replace(/[^0-9]/g, '');
    if (!numero) {
      res.status(400).json({ success: false, message: 'Teléfono inválido' });
      return;
    }
    const cliente = await Cliente.findOne({
      where: {
        telefono: { [Op.like]: `%${numero}%` },
        activo: true
      }
    });
    res.json({
      success: true,
      data: cliente || null
    });
  } catch (error) {
    console.error('Error al obtener cliente por teléfono:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Vincular teléfono a cliente existente
 */
export const linkPhoneToCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, phone } = req.body as { clientId: number; phone: string };
    if (!clientId || !phone) {
      res.status(400).json({ success: false, message: 'clientId y phone son requeridos' });
      return;
    }
    const numero = (phone || '').replace(/[^0-9]/g, '');
    const cliente = await Cliente.findByPk(clientId);
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }
    await cliente.update({ telefono: numero });
    res.json({ success: true, data: cliente });
  } catch (error) {
    console.error('Error al vincular teléfono a cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Registro ligero de cliente (nombre, dni, phone)
 */
export const registerClienteLite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar token especial para chatbot (si no hay usuario autenticado)
    if (!req.user) {
      const chatToken = req.headers['x-chatbot-token'] || req.body.token;
      const expectedToken = process.env.CHATBOT_API_TOKEN;

      if (expectedToken && chatToken !== expectedToken) {
        res.status(401).json({
          success: false,
          message: 'Token inválido para chatbot'
        });
        return;
      }
    }

    const { name, dni, phone } = req.body as { name: string; dni: string; phone: string };
    if (!name || !dni || !phone) {
      res.status(400).json({ success: false, message: 'name, dni y phone son requeridos' });
      return;
    }
    const numero = (phone || '').replace(/[^0-9]/g, '');
    // Evitar duplicados por DNI
    const existingByDni = await Cliente.findOne({ where: { numero_documento: dni } });
    if (existingByDni) {
      // Actualizar teléfono si falta
      if (!existingByDni.telefono) {
        await existingByDni.update({ telefono: numero });
      }
      res.json({ success: true, data: existingByDni, message: 'Cliente existente actualizado' });
      return;
    }
    // Evitar duplicados por teléfono
    const existingByPhone = await Cliente.findOne({
      where: { telefono: { [Op.like]: `%${numero}%` } }
    });
    if (existingByPhone) {
      res.json({ success: true, data: existingByPhone, message: 'Cliente existente por teléfono' });
      return;
    }
    const codigo = `CLI-${Date.now()}`;
    const nuevo = await Cliente.create({
      codigo,
      nombre: name,
      numero_documento: dni,
      tipo_documento: 'DNI',
      tipo_cliente: 'NATURAL',
      telefono: numero,
      activo: true
    });
    res.status(201).json({ success: true, data: nuevo, message: 'Cliente creado' });
  } catch (error) {
    console.error('Error en registro ligero de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

