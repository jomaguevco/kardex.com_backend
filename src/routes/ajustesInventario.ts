import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import {
  getTiposMovimiento,
  crearAjusteInventario,
  getAjustesInventario,
  aprobarAjusteInventario,
  rechazarAjusteInventario
} from '../controllers/ajusteInventarioController';

const router = express.Router();

/**
 * @route   GET /api/ajustes-inventario/tipos-movimiento
 * @desc    Obtener tipos de movimiento disponibles
 * @access  Private (ADMINISTRADOR)
 */
router.get('/tipos-movimiento', authenticateToken, requireRole(['ADMINISTRADOR']), getTiposMovimiento);

/**
 * @route   GET /api/ajustes-inventario
 * @desc    Obtener ajustes de inventario
 * @access  Private (ADMINISTRADOR)
 */
router.get('/', authenticateToken, requireRole(['ADMINISTRADOR']), getAjustesInventario);

/**
 * @route   POST /api/ajustes-inventario
 * @desc    Crear ajuste de inventario
 * @access  Private (ADMINISTRADOR)
 */
router.post('/', authenticateToken, requireRole(['ADMINISTRADOR']), crearAjusteInventario);

/**
 * @route   PUT /api/ajustes-inventario/:id/aprobar
 * @desc    Aprobar ajuste de inventario pendiente
 * @access  Private (ADMINISTRADOR)
 */
router.put('/:id/aprobar', authenticateToken, requireRole(['ADMINISTRADOR']), aprobarAjusteInventario);

/**
 * @route   PUT /api/ajustes-inventario/:id/rechazar
 * @desc    Rechazar ajuste de inventario pendiente
 * @access  Private (ADMINISTRADOR)
 */
router.put('/:id/rechazar', authenticateToken, requireRole(['ADMINISTRADOR']), rechazarAjusteInventario);

export default router;

