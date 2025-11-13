import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PedidoAttributes {
  id: number;
  cliente_id: number;
  usuario_id: number;
  numero_pedido: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'PROCESADO' | 'CANCELADO' | 'RECHAZADO';
  tipo_pedido: 'PEDIDO_APROBACION' | 'COMPRA_DIRECTA';
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observaciones?: string;
  fecha_pedido: Date;
  aprobado_por?: number;
  fecha_aprobacion?: Date;
  venta_id?: number;
  motivo_rechazo?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface PedidoCreationAttributes extends Optional<PedidoAttributes, 'id' | 'descuento' | 'impuesto' | 'observaciones' | 'aprobado_por' | 'fecha_aprobacion' | 'venta_id' | 'motivo_rechazo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Pedido extends Model<PedidoAttributes, PedidoCreationAttributes> implements PedidoAttributes {
  public id!: number;
  public cliente_id!: number;
  public usuario_id!: number;
  public numero_pedido!: string;
  public estado!: 'PENDIENTE' | 'APROBADO' | 'PROCESADO' | 'CANCELADO' | 'RECHAZADO';
  public tipo_pedido!: 'PEDIDO_APROBACION' | 'COMPRA_DIRECTA';
  public subtotal!: number;
  public descuento!: number;
  public impuesto!: number;
  public total!: number;
  public observaciones?: string;
  public fecha_pedido!: Date;
  public aprobado_por?: number;
  public fecha_aprobacion?: Date;
  public venta_id?: number;
  public motivo_rechazo?: string;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;

  // Asociaciones
  public readonly detalles?: any[];
  public readonly cliente?: any;
  public readonly usuario?: any;
  public readonly aprobador?: any;
  public readonly venta?: any;
}

Pedido.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario (cliente) que crea el pedido'
    },
    numero_pedido: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    estado: {
      type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'PROCESADO', 'CANCELADO', 'RECHAZADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE'
    },
    tipo_pedido: {
      type: DataTypes.ENUM('PEDIDO_APROBACION', 'COMPRA_DIRECTA'),
      allowNull: false,
      defaultValue: 'PEDIDO_APROBACION',
      comment: 'PEDIDO_APROBACION requiere aprobación, COMPRA_DIRECTA se procesa inmediatamente'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_pedido: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario (vendedor/admin) que aprobó el pedido'
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ventas',
        key: 'id'
      },
      comment: 'ID de la venta generada cuando el pedido se procesa'
    },
    motivo_rechazo: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'pedidos',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true,
    indexes: [
      {
        fields: ['cliente_id']
      },
      {
        fields: ['usuario_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_pedido']
      }
    ]
  }
);

export default Pedido;

