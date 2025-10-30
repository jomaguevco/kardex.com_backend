import { Router } from 'express';
import { login, register, getProfile } from '../controllers/authController';
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

// Rutas
router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/profile', authenticateToken, getProfile);

export default router;

