import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DetalleCompraAttributes {
  id: number;
  compra_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  fecha_creacion?: Date;
}

interface DetalleCompraCreationAttributes extends Optional<DetalleCompraAttributes, 'id' | 'fecha_creacion'> {}

class DetalleCompra extends Model<DetalleCompraAttributes, DetalleCompraCreationAttributes> implements DetalleCompraAttributes {
  public id!: number;
  public compra_id!: number;
  public producto_id!: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public descuento!: number;
  public subtotal!: number;
  public readonly fecha_creacion!: Date;

  // Asociaciones (se definen en index.ts para evitar importaciones circulares)
  public compra?: any;
  public producto?: any;
}

DetalleCompra.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    compra_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'detalle_compras',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
    underscored: true
  }
);

export default DetalleCompra;
