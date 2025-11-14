import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'sistema_ventas',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro_aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  cors: {
    origin: (() => {
      const origins = process.env.CORS_ORIGIN || 'http://localhost:3000';
      
      // Si es un wildcard o función, retornar directamente
      if (origins === '*') return '*';
      
      // Soportar múltiples orígenes separados por coma
      const originList = origins.split(',').map(o => {
        const trimmed = o.trim();
        return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      });
      
      // Si hay un patrón de Vercel, crear función de validación
      if (originList.some(o => o.includes('vercel.app'))) {
        return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Permitir requests sin origin (como Postman)
          if (!origin) return callback(null, true);
          
          // Permitir todos los subdominios de vercel.app del proyecto
          if (origin.includes('vercel.app') && 
              (origin.includes('kardex-com') || origin.includes('jomaguevcos'))) {
            return callback(null, true);
          }
          
          // Verificar si está en la lista explícita
          if (originList.includes(origin)) {
            return callback(null, true);
          }
          
          callback(new Error('Not allowed by CORS'));
        };
      }
      
      return originList.length === 1 ? originList[0] : originList;
    })()
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    path: process.env.UPLOAD_PATH || 'uploads'
  }
};

