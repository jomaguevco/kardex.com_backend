import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Usuario from '../models/Usuario';

export const getUsuarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '', rol, activo } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { nombre_usuario: { [Op.like]: `%${search}%` } },
        { nombre_completo: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (rol) {
      whereClause.rol = rol;
    }

    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }

    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['contrasena'] },
      limit: Number(limit),
      offset,
      order: [['nombre_completo', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        usuarios,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getUsuarioById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre_usuario, nombre_completo, email, contrasena, rol, telefono, activo } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({
      where: { nombre_usuario }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
      return;
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email) {
      const existingEmail = await Usuario.findOne({
        where: { email }
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
        return;
      }
    }

    // Hash de la contraseña
    const hashedPassword = require('crypto').createHash('sha256').update(contrasena).digest('hex');

    const usuario = await Usuario.create({
      nombre_usuario,
      nombre_completo,
      email,
      contrasena: hashedPassword,
      rol: rol || 'VENDEDOR',
      telefono,
      activo: activo !== undefined ? activo : true
    });

    const usuarioResponse = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['contrasena'] }
    });

    res.status(201).json({
      success: true,
      data: usuarioResponse,
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, telefono, activo, contrasena } = req.body;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== usuario.email) {
      const existingEmail = await Usuario.findOne({
        where: { email, id: { [Op.ne]: id } }
      });

      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
        return;
      }
    }

    // Actualizar campos
    const updateData: any = {};
    if (nombre_completo) updateData.nombre_completo = nombre_completo;
    if (email) updateData.email = email;
    if (rol) updateData.rol = rol;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (activo !== undefined) updateData.activo = activo;
    if (contrasena) {
      const hashedPassword = require('crypto').createHash('sha256').update(contrasena).digest('hex');
      updateData.contrasena = hashedPassword;
    }

    await usuario.update(updateData);

    const usuarioResponse = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] }
    });

    res.json({
      success: true,
      data: usuarioResponse,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    // No permitir auto-eliminación
    if (Number(id) === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
      return;
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Soft delete - marcar como inactivo
    await usuario.update({ activo: false });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const toggleUsuarioActivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user.id;

    // No permitir desactivar tu propio usuario
    if (Number(id) === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propio usuario'
      });
      return;
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    await usuario.update({ activo: !usuario.activo });

    res.json({
      success: true,
      data: {
        id: usuario.id,
        activo: !usuario.activo
      },
      message: `Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

