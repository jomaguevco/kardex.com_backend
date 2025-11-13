import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificacionAttributes {
  id: number;
  usuario_id: number;
  tipo: 'STOCK_BAJO' | 'COMPRA_PENDIENTE' | 'VENTA_PENDIENTE' | 'TRANSACCION' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  leido: boolean;
  referencia_id?: number;
  referencia_tipo?: string;
  fecha_creacion?: Date;
}

interface NotificacionCreationAttributes extends Optional<NotificacionAttributes, 'id' | 'leido' | 'fecha_creacion'> {}

class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> implements NotificacionAttributes {
  public id!: number;
  public usuario_id!: number;
  public tipo!: 'STOCK_BAJO' | 'COMPRA_PENDIENTE' | 'VENTA_PENDIENTE' | 'TRANSACCION' | 'SISTEMA';
  public titulo!: string;
  public mensaje!: string;
  public leido!: boolean;
  public referencia_id?: number;
  public referencia_tipo?: string;
  public readonly fecha_creacion!: Date;
}

Notificacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM('STOCK_BAJO', 'COMPRA_PENDIENTE', 'VENTA_PENDIENTE', 'TRANSACCION', 'SISTEMA'),
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    leido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    referencia_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    referencia_tipo: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'notificaciones',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
    underscored: true
  }
);

export default Notificacion;

