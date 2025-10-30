import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import sequelize from './config/database';
import Usuario from './models/Usuario';

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Demasiadas solicitudes desde esta IP'
});
app.use(limiter);

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Ventas KARDEX - API Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      productos: '/api/productos',
      ventas: '/api/ventas',
      compras: '/api/compras',
      kardex: '/api/kardex',
      reportes: '/api/reportes'
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api', routes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Crear usuario admin si no existe
const ensureAdminUser = async () => {
  try {
    const adminUser = await Usuario.findOne({ where: { nombre_usuario: 'admin' } });
    
    if (!adminUser) {
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      await Usuario.create({
        nombre_usuario: 'admin',
        contrasena: hashedPassword,
        nombre_completo: 'Administrador del Sistema',
        email: 'admin@miempresa.com',
        rol: 'ADMINISTRADOR',
        activo: true
      });
      console.log('✅ Usuario admin creado (admin/admin123)');
    } else {
      console.log('✅ Usuario admin ya existe');
    }
  } catch (error) {
    console.error('⚠️ Error al crear usuario admin:', error);
  }
};

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Sincronizar modelos (solo en desarrollo)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ force: false, alter: false });
      console.log('✅ Modelos sincronizados');
    }

    // Crear usuario admin si no existe
    await ensureAdminUser();

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${config.port}`);
      console.log(`📱 Entorno: ${config.nodeEnv}`);
      console.log(`🌐 URL: http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;

