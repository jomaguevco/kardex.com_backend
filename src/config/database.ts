import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const useSsl = (process.env.DB_SSL || '').toLowerCase() === 'true';

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'sistema_ventas_kardex',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: true
        }
      }
    : {}
});

export default sequelize;

