import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface VentaAttributes {
  id: number;
  numero_factura: string;
  cliente_id: number;
  fecha_venta: Date;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  estado: 'PENDIENTE' | 'PROCESADA' | 'ANULADA';
  observaciones?: string;
  usuario_id: number;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface VentaCreationAttributes extends Optional<VentaAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Venta extends Model<VentaAttributes, VentaCreationAttributes> implements VentaAttributes {
  public id!: number;
  public numero_factura!: string;
  public cliente_id!: number;
  public fecha_venta!: Date;
  public subtotal!: number;
  public descuento!: number;
  public impuestos!: number;
  public total!: number;
  public estado!: 'PENDIENTE' | 'PROCESADA' | 'ANULADA';
  public observaciones?: string;
  public usuario_id!: number;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;

  // Asociaciones (se definen en index.ts para evitar importaciones circulares)
  public detalles?: any[];
  public cliente?: any;
  public usuario?: any;
}

Venta.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    numero_factura: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_venta: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    impuestos: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'PROCESADA', 'ANULADA'),
      allowNull: false,
      defaultValue: 'PENDIENTE'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'ventas',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Venta;
