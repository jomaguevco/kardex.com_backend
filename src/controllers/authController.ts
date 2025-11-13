import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import Usuario from '../models/Usuario';
import PasswordResetToken from '../models/PasswordResetToken';
import { Cliente, ClienteUsuario } from '../models';
import { getRolePermissions } from '../middleware/permissions';
import sequelize from '../config/database';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre_usuario, contrasena } = req.body;

    // Buscar usuario por nombre_usuario
    const usuario = await Usuario.findOne({ where: { nombre_usuario } });
    
    if (!usuario) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Verificar contraseña (en la BD está hasheada con SHA256)
    const hashedPassword = require('crypto').createHash('sha256').update(contrasena).digest('hex');
    const isPasswordValid = usuario.contrasena === hashedPassword;
    
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      res.status(401).json({ message: 'Usuario inactivo' });
      return;
    }

    // Actualizar último acceso
    await usuario.update({ fecha_ultimo_acceso: new Date() });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        nombre: usuario.nombre_completo,
        rol: usuario.rol
      },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    // Obtener permisos del rol
    const permisos = getRolePermissions(usuario.rol as any);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol,
          es_cliente_publico: usuario.es_cliente_publico,
          foto_perfil: usuario.foto_perfil,
          preferencias: usuario.preferencias
        },
        permisos
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre_usuario, nombre_completo, email, contrasena, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ where: { nombre_usuario } });
    
    if (existingUser) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return;
    }

    // Hash de la contraseña con SHA2 (como en la BD)
    const hashedPassword = require('crypto').createHash('sha256').update(contrasena).digest('hex');

    // Crear nuevo usuario
    const usuario = await Usuario.create({
      nombre_usuario,
      nombre_completo,
      email,
      contrasena: hashedPassword,
      rol: rol || 'VENDEDOR'
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: usuario.id,
        nombre: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const usuario = await Usuario.findByPk(userId, {
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, nombre_usuario } = req.body;

    // Buscar usuario por email o nombre_usuario
    const whereClause: any = {};
    if (email) {
      whereClause.email = email;
    } else if (nombre_usuario) {
      whereClause.nombre_usuario = nombre_usuario;
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Debe proporcionar email o nombre de usuario' 
      });
      return;
    }

    const usuario = await Usuario.findOne({ where: whereClause });

    if (!usuario) {
      // Por seguridad, no revelamos si el usuario existe o no
      res.json({
        success: true,
        message: 'Si el usuario existe, se enviará un enlace de recuperación'
      });
      return;
    }

    // Invalidar tokens anteriores
    await PasswordResetToken.update(
      { used: true },
      { where: { usuario_id: usuario.id, used: false } }
    );

    // Generar nuevo token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    await PasswordResetToken.create({
      usuario_id: usuario.id,
      token,
      expires_at: expiresAt
    });

    // En un entorno real, aquí se enviaría un email con el token
    // Por ahora, lo retornamos en la respuesta (solo para desarrollo)
    const resetLink = `${config.cors.origin}/reset-password?token=${token}`;
    
    console.log(`Password reset link for ${usuario.email || usuario.nombre_usuario}: ${resetLink}`);

    res.json({
      success: true,
      message: 'Si el usuario existe, se enviará un enlace de recuperación',
      // Solo en desarrollo - remover en producción
      ...(config.nodeEnv === 'development' && { resetLink, token })
    });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, nueva_contrasena } = req.body;

    if (!token || !nueva_contrasena) {
      res.status(400).json({ 
        success: false,
        message: 'Token y nueva contraseña son requeridos' 
      });
      return;
    }

    if (nueva_contrasena.length < 6) {
      res.status(400).json({ 
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
      return;
    }

    // Buscar token válido
    const resetToken = await PasswordResetToken.findOne({
      where: { 
        token,
        used: false
      }
    });

    if (!resetToken) {
      res.status(400).json({ 
        success: false,
        message: 'Token inválido o ya utilizado' 
      });
      return;
    }

    // Verificar si el token expiró
    if (new Date() > resetToken.expires_at) {
      res.status(400).json({ 
        success: false,
        message: 'El token ha expirado' 
      });
      return;
    }

    const usuario = await Usuario.findByPk(resetToken.usuario_id);

    if (!usuario) {
      res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
      return;
    }

    // Actualizar contraseña
    const hashedPassword = require('crypto').createHash('sha256').update(nueva_contrasena).digest('hex');
    await usuario.update({ contrasena: hashedPassword });

    // Marcar token como usado
    await resetToken.update({ used: true });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { contrasena_actual, nueva_contrasena } = req.body;

    if (!contrasena_actual || !nueva_contrasena) {
      res.status(400).json({ 
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas' 
      });
      return;
    }

    if (nueva_contrasena.length < 6) {
      res.status(400).json({ 
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
      return;
    }

    const usuario = await Usuario.findByPk(userId);

    if (!usuario) {
      res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
      return;
    }

    // Verificar contraseña actual
    const hashedCurrentPassword = require('crypto').createHash('sha256').update(contrasena_actual).digest('hex');
    if (usuario.contrasena !== hashedCurrentPassword) {
      res.status(400).json({ 
        success: false,
        message: 'Contraseña actual incorrecta' 
      });
      return;
    }

    // Actualizar contraseña
    const hashedNewPassword = require('crypto').createHash('sha256').update(nueva_contrasena).digest('hex');
    await usuario.update({ contrasena: hashedNewPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { nombre_completo, email, telefono } = req.body;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Actualizar datos
    await usuario.update({
      nombre_completo,
      email,
      telefono
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const uploadFotoPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
      return;
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Construir URL de la foto
    const fotoUrl = `/uploads/perfiles/${req.file.filename}`;

    // Actualizar foto de perfil
    await usuario.update({ foto_perfil: fotoUrl });

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: {
        foto_perfil: fotoUrl
      }
    });
  } catch (error) {
    console.error('Error al subir foto de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const actualizarPreferencias = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const { preferencias } = req.body;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Guardar preferencias como JSON string
    await usuario.update({
      preferencias: JSON.stringify(preferencias)
    });

    res.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: {
        preferencias
      }
    });
  } catch (error) {
    console.error('Error al actualizar preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Registro público de clientes
 */
export const registerCliente = async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      nombre,
      email,
      telefono,
      tipo_documento,
      numero_documento,
      direccion,
      contrasena
    } = req.body;

    // Validaciones
    if (!nombre || !email || !contrasena || !numero_documento) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: nombre, email, contraseña, número de documento'
      });
      return;
    }

    // Verificar si el email ya está registrado
    const existingUsuario = await Usuario.findOne({
      where: { email },
      transaction
    });

    if (existingUsuario) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
      return;
    }

    // Verificar si el documento ya está registrado
    const existingCliente = await Cliente.findOne({
      where: { numero_documento },
      transaction
    });

    if (existingCliente) {
      // Verificar si ya tiene usuario asociado
      const clienteUsuario = await ClienteUsuario.findOne({
        where: { cliente_id: existingCliente.id },
        transaction
      });

      if (clienteUsuario) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: 'Este documento ya tiene una cuenta registrada'
        });
        return;
      }
    }

    // Crear usuario con rol CLIENTE
    const hashedPassword = require('crypto').createHash('sha256').update(contrasena).digest('hex');
    const nombreUsuario = `cliente_${numero_documento}`;

    const usuario = await Usuario.create({
      nombre_usuario: nombreUsuario,
      nombre_completo: nombre,
      email,
      telefono,
      contrasena: hashedPassword,
      rol: 'CLIENTE',
      es_cliente_publico: true,
      activo: true
    }, { transaction });

    // Crear o vincular cliente
    let cliente;
    if (existingCliente) {
      cliente = existingCliente;
    } else {
      // Generar código de cliente
      const ultimoCliente = await Cliente.findOne({
        order: [['id', 'DESC']],
        transaction
      });
      const correlativo = ultimoCliente ? ultimoCliente.id + 1 : 1;
      const codigo = `CLI-${String(correlativo).padStart(6, '0')}`;

      cliente = await Cliente.create({
        codigo,
        nombre,
        tipo_documento: tipo_documento || 'DNI',
        numero_documento,
        direccion,
        telefono,
        email,
        tipo_cliente: 'NATURAL',
        activo: true
      }, { transaction });
    }

    // Crear relación cliente-usuario
    await ClienteUsuario.create({
      usuario_id: usuario.id,
      cliente_id: cliente.id,
      fecha_vinculacion: new Date()
    }, { transaction });

    await transaction.commit();

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        nombre: usuario.nombre_completo,
        rol: usuario.rol
      },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    // Obtener permisos
    const permisos = getRolePermissions('CLIENTE');

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. ¡Bienvenido!',
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol,
          es_cliente_publico: true
        },
        cliente: {
          id: cliente.id,
          codigo: cliente.codigo,
          numero_documento: cliente.numero_documento
        },
        permisos
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error en registro de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener permisos del usuario autenticado
 */
export const getPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    const permisos = getRolePermissions(usuario.rol as any);

    res.json({
      success: true,
      data: {
        rol: usuario.rol,
        permisos
      }
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};