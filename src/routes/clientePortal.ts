import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import {
  getMisCompras,
  getCatalogo,
  getMisFacturas,
  getEstadoCuenta,
  getDetalleCompra
} from '../controllers/clientePortalController';

const router = express.Router();

/**
 * @route   GET /api/cliente-portal/mis-compras
 * @desc    Obtener historial de compras del cliente
 * @access  Private (CLIENTE)
 */
router.get('/mis-compras', authenticateToken, requireRole('CLIENTE'), getMisCompras);

/**
 * @route   GET /api/cliente-portal/catalogo
 * @desc    Obtener catálogo de productos disponibles
 * @access  Private (CLIENTE) o Public (dependiendo de configuración)
 */
router.get('/catalogo', getCatalogo); // Catálogo público

/**
 * @route   GET /api/cliente-portal/mis-facturas
 * @desc    Obtener facturas del cliente
 * @access  Private (CLIENTE)
 */
router.get('/mis-facturas', authenticateToken, requireRole('CLIENTE'), getMisFacturas);

/**
 * @route   GET /api/cliente-portal/estado-cuenta
 * @desc    Obtener estado de cuenta del cliente
 * @access  Private (CLIENTE)
 */
router.get('/estado-cuenta', authenticateToken, requireRole('CLIENTE'), getEstadoCuenta);

/**
 * @route   GET /api/cliente-portal/compra/:id
 * @desc    Obtener detalle de una compra específica
 * @access  Private (CLIENTE)
 */
router.get('/compra/:id', authenticateToken, requireRole('CLIENTE'), getDetalleCompra);

export default router;

