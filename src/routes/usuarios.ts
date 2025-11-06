import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  toggleUsuarioActivo
} from '../controllers/usuarioController';

const router = Router();

// Middleware: todas las rutas requieren autenticación
router.use(authenticateToken);

// Esquemas de validación
const createUsuarioSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(50).required(),
  nombre_completo: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().optional(),
  contrasena: Joi.string().min(6).required(),
  rol: Joi.string().valid('ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO', 'CONTADOR').optional(),
  telefono: Joi.string().max(20).optional(),
  activo: Joi.boolean().optional()
});

const updateUsuarioSchema = Joi.object({
  nombre_completo: Joi.string().min(2).max(200).optional(),
  email: Joi.string().email().optional(),
  rol: Joi.string().valid('ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO', 'CONTADOR').optional(),
  telefono: Joi.string().max(20).optional(),
  activo: Joi.boolean().optional(),
  contrasena: Joi.string().min(6).optional()
});

// Rutas
router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', validate(createUsuarioSchema), createUsuario);
router.put('/:id', validate(updateUsuarioSchema), updateUsuario);
router.delete('/:id', deleteUsuario);
router.patch('/:id/toggle-activo', toggleUsuarioActivo);

export default router;

