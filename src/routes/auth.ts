import { Router } from 'express';
import { login, register, getProfile, requestPasswordReset, resetPassword, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Esquemas de validación
const loginSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(50).required(),
  contrasena: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(50).required(),
  nombre_completo: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  contrasena: Joi.string().min(6).required(),
  rol: Joi.string().valid('ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO', 'CONTADOR').optional()
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().optional(),
  nombre_usuario: Joi.string().min(3).max(50).optional()
}).or('email', 'nombre_usuario');

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  nueva_contrasena: Joi.string().min(6).required()
});

const changePasswordSchema = Joi.object({
  contrasena_actual: Joi.string().min(6).required(),
  nueva_contrasena: Joi.string().min(6).required()
});

// Rutas
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/profile', authenticateToken, getProfile);
router.post('/forgot-password', validate(requestPasswordResetSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), changePassword);

export default router;

