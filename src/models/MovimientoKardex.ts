import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MovimientoKardexAttributes {
  id: number;
  producto_id: number;
  almacen_id: number;
  tipo_movimiento: 'ENTRADA_COMPRA' | 'ENTRADA_DEVOLUCION_CLIENTE' | 'ENTRADA_AJUSTE_POSITIVO' | 'ENTRADA_TRANSFERENCIA' | 'SALIDA_VENTA' | 'SALIDA_DEVOLUCION_PROVEEDOR' | 'SALIDA_AJUSTE_NEGATIVO' | 'SALIDA_TRANSFERENCIA' | 'SALIDA_MERMA';
  tipo_movimiento_id?: number;
  almacen_destino_id?: number;
  cantidad: number;
  precio_unitario: number;
  costo_total: number;
  stock_anterior: number;
  stock_nuevo: number;
  documento_referencia: string;
  numero_documento?: string;
  fecha_movimiento: Date;
  usuario_id: number;
  autorizado_por?: number;
  fecha_autorizacion?: Date;
  observaciones?: string;
  motivo_movimiento?: string;
  estado_movimiento: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fecha_creacion?: Date;
}

interface MovimientoKardexCreationAttributes extends Optional<MovimientoKardexAttributes, 'id' | 'fecha_creacion'> {}

class MovimientoKardex extends Model<MovimientoKardexAttributes, MovimientoKardexCreationAttributes> implements MovimientoKardexAttributes {
  public id!: number;
  public producto_id!: number;
  public almacen_id!: number;
  public tipo_movimiento!: 'ENTRADA_COMPRA' | 'ENTRADA_DEVOLUCION_CLIENTE' | 'ENTRADA_AJUSTE_POSITIVO' | 'ENTRADA_TRANSFERENCIA' | 'SALIDA_VENTA' | 'SALIDA_DEVOLUCION_PROVEEDOR' | 'SALIDA_AJUSTE_NEGATIVO' | 'SALIDA_TRANSFERENCIA' | 'SALIDA_MERMA';
  public tipo_movimiento_id?: number;
  public almacen_destino_id?: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public costo_total!: number;
  public stock_anterior!: number;
  public stock_nuevo!: number;
  public documento_referencia!: string;
  public numero_documento?: string;
  public fecha_movimiento!: Date;
  public usuario_id!: number;
  public autorizado_por?: number;
  public fecha_autorizacion?: Date;
  public observaciones?: string;
  public motivo_movimiento?: string;
  public estado_movimiento!: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  public readonly fecha_creacion!: Date;
}

MovimientoKardex.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    almacen_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipo_movimiento: {
      type: DataTypes.ENUM(
        'ENTRADA_COMPRA', 'ENTRADA_DEVOLUCION_CLIENTE', 'ENTRADA_AJUSTE_POSITIVO', 'ENTRADA_TRANSFERENCIA',
        'SALIDA_VENTA', 'SALIDA_DEVOLUCION_PROVEEDOR', 'SALIDA_AJUSTE_NEGATIVO', 'SALIDA_TRANSFERENCIA', 'SALIDA_MERMA'
      ),
      allowNull: false
    },
    tipo_movimiento_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    almacen_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cantidad: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    costo_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stock_nuevo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    documento_referencia: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    numero_documento: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fecha_movimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    autorizado_por: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_autorizacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    motivo_movimiento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado_movimiento: {
      type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'),
      allowNull: false,
      defaultValue: 'APROBADO'
    }
  },
  {
    sequelize,
    tableName: 'movimientos_kardex',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
    underscored: true
  }
);

export default MovimientoKardex;
