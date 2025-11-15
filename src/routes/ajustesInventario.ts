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
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.get('/tipos-movimiento', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), getTiposMovimiento);

/**
 * @route   GET /api/ajustes-inventario
 * @desc    Obtener ajustes de inventario
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.get('/', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), getAjustesInventario);

/**
 * @route   POST /api/ajustes-inventario
 * @desc    Crear ajuste de inventario
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.post('/', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), crearAjusteInventario);

/**
 * @route   PUT /api/ajustes-inventario/:id/aprobar
 * @desc    Aprobar ajuste de inventario pendiente
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.put('/:id/aprobar', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), aprobarAjusteInventario);

/**
 * @route   PUT /api/ajustes-inventario/:id/rechazar
 * @desc    Rechazar ajuste de inventario pendiente
 * @access  Private (VENDEDOR, ADMINISTRADOR)
 */
router.put('/:id/rechazar', authenticateToken, requireRole(['VENDEDOR', 'ADMINISTRADOR']), rechazarAjusteInventario);

export default router;

