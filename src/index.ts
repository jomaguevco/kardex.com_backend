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
import { mediatorMiddleware } from './middleware/mediator';
import sequelize from './config/database';
import Usuario from './models/Usuario';
import { seedInitialData } from './scripts/seedInitialData';
import { fixProductosTable } from './scripts/fixProductosTable';
import eventBus from './utils/eventBus';

const app = express();

// Configurar trust proxy para Railway (necesario para rate limiting)
app.set('trust proxy', true);

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
// Deshabilitar validación de trust proxy ya que estamos en Railway y es seguro
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Demasiadas solicitudes desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false // Deshabilitar validación de trust proxy
  }
});
app.use(limiter);

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Mediador: genera contexto y eventos para cada petición
app.use(mediatorMiddleware);

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

// Suscriptores básicos del bus de eventos (Message Oriented Middleware)
eventBus.on('mediator:request-started', (payload) => {
  if (config.nodeEnv === 'development') {
    console.log(`➡️  [${payload.requestId}] ${payload.metodo} ${payload.ruta}`);
  }
});

eventBus.on('mediator:request-finished', (payload) => {
  if (config.nodeEnv === 'development') {
    console.log(`✅ [${payload.requestId}] ${payload.statusCode} (${payload.durationMs}ms)`);
  }
});

eventBus.on('monitor:transaction-started', (payload) => {
  if (config.nodeEnv === 'development') {
    console.log(`🟡 Tx ${payload.id} iniciada (${payload.modulo}:${payload.accion})`);
  }
});

eventBus.on('monitor:transaction-finished', (payload) => {
  if (config.nodeEnv === 'development') {
    console.log(`🔵 Tx ${payload.id} finalizada con estado ${payload.estado}`);
  }
});

// Crear directorio de uploads si no existe
const ensureUploadsDirectory = () => {
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = path.join(__dirname, '../uploads/perfiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Directorio de uploads creado');
  } else {
    console.log('✅ Directorio de uploads existe');
  }
};

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
    // Crear directorio de uploads
    ensureUploadsDirectory();

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Sincronizar modelos (crear tablas si no existen)
    // En producción solo crea las tablas, no las modifica ni borra
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Modelos sincronizados (tablas verificadas)');
    
    // Verificar/crear tabla password_reset_tokens si no existe
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          INDEX idx_token (token),
          INDEX idx_usuario_id (usuario_id),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabla password_reset_tokens verificada/creada');
    } catch (error: any) {
      // Si la tabla ya existe o hay un error menor, continuar
      if (!error.message.includes('already exists')) {
        console.warn('⚠️ Advertencia al crear tabla password_reset_tokens:', error.message);
      }
    }

    // Crear usuario admin si no existe
    await ensureAdminUser();

    // Corregir tabla productos si es necesario
    await fixProductosTable();

    // Insertar datos iniciales (categorías, marcas, unidades, etc.)
    await seedInitialData();

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

