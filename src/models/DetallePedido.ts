import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DetallePedidoAttributes {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface DetallePedidoCreationAttributes extends Optional<DetallePedidoAttributes, 'id' | 'descuento' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class DetallePedido extends Model<DetallePedidoAttributes, DetallePedidoCreationAttributes> implements DetallePedidoAttributes {
  public id!: number;
  public pedido_id!: number;
  public producto_id!: number;
  public cantidad!: number;
  public precio_unitario!: number;
  public descuento!: number;
  public subtotal!: number;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

DetallePedido.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pedido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pedidos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'detalle_pedidos',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true,
    indexes: [
      {
        fields: ['pedido_id']
      },
      {
        fields: ['producto_id']
      }
    ]
  }
);

export default DetallePedido;

