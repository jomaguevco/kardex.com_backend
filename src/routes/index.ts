import { Router } from 'express';
import authRoutes from './auth';
import productoRoutes from './productos';
import ventaRoutes from './ventas';
import compraRoutes from './compras';
import clienteRoutes from './clientes';
import proveedorRoutes from './proveedores';
import kardexRoutes from './kardex';
import reporteRoutes from './reportes';
import usuarioRoutes from './usuarios';

const router = Router();

// Rutas de la API
router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/ventas', ventaRoutes);
router.use('/compras', compraRoutes);
router.use('/clientes', clienteRoutes);
router.use('/proveedores', proveedorRoutes);
router.use('/kardex', kardexRoutes);
router.use('/reportes', reporteRoutes);
router.use('/usuarios', usuarioRoutes);

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

export default router;

