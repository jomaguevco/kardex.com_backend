import { Router } from 'express';
import packageJson from '../../package.json';
import authRoutes from './auth';
import productoRoutes from './productos';
import ventaRoutes from './ventas';
import compraRoutes from './compras';
import clienteRoutes from './clientes';
import proveedorRoutes from './proveedores';
import kardexRoutes from './kardex';
import reporteRoutes from './reportes';
import usuarioRoutes from './usuarios';
import monitorRoutes from './monitor';
import notificacionRoutes from './notificaciones';
import clientePortalRoutes from './clientePortal';
import pedidoRoutes from './pedidos';
import ajustesInventarioRoutes from './ajustesInventario';

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
router.use('/monitor-transacciones', monitorRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/cliente-portal', clientePortalRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/ajustes-inventario', ajustesInventarioRoutes);

// Ruta de salud del servidor
router.get('/health', (req, res) => {
  const backendVersion = packageJson.version ?? '0.0.0';
  const deploymentSignature = process.env.DEPLOYMENT_SIGNATURE ?? 'local';
  const environment = process.env.NODE_ENV ?? 'development';

  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    backendVersion,
    deploymentSignature,
    environment
  });
});

export default router;

