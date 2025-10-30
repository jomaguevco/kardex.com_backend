import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import Usuario from '../models/Usuario';

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

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol
        }
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