import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type EstadoMonitoreo = 'EXITO' | 'ERROR';

interface MonitoreoTransaccionAttributes {
  id: number;
  modulo: string;
  accion: string;
  referencia?: string;
  estado: EstadoMonitoreo;
  mensaje?: string;
  request_id?: string;
  payload?: Record<string, unknown> | null;
  iniciado_en: Date;
  completado_en?: Date | null;
  duracion_ms?: number | null;
}

type MonitoreoTransaccionCreationAttributes = Optional<
  MonitoreoTransaccionAttributes,
  'id' | 'estado' | 'mensaje' | 'request_id' | 'payload' | 'completado_en' | 'duracion_ms'
>;

class MonitoreoTransaccion
  extends Model<MonitoreoTransaccionAttributes, MonitoreoTransaccionCreationAttributes>
  implements MonitoreoTransaccionAttributes {
  public id!: number;
  public modulo!: string;
  public accion!: string;
  public referencia?: string;
  public estado!: EstadoMonitoreo;
  public mensaje?: string;
  public request_id?: string;
  public payload?: Record<string, unknown> | null;
  public iniciado_en!: Date;
  public completado_en?: Date | null;
  public duracion_ms?: number | null;
}

MonitoreoTransaccion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    modulo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    accion: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    referencia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('EXITO', 'ERROR'),
      allowNull: false,
      defaultValue: 'EXITO'
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    request_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    },
    iniciado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completado_en: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duracion_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'monitoreo_transacciones',
    timestamps: false,
    underscored: true
  }
);

export default MonitoreoTransaccion;

