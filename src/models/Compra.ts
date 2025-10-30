import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompraAttributes {
  id: number;
  numero_factura: string;
  proveedor_id: number;
  fecha_compra: Date;
  fecha_vencimiento?: Date;
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

interface CompraCreationAttributes extends Optional<CompraAttributes, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Compra extends Model<CompraAttributes, CompraCreationAttributes> implements CompraAttributes {
  public id!: number;
  public numero_factura!: string;
  public proveedor_id!: number;
  public fecha_compra!: Date;
  public fecha_vencimiento?: Date;
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
  public proveedor?: any;
  public usuario?: any;
}

Compra.init(
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
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_compra: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    tableName: 'compras',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Compra;
