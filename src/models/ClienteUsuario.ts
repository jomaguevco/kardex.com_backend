import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ClienteUsuarioAttributes {
  id: number;
  usuario_id: number;
  cliente_id: number;
  fecha_vinculacion?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface ClienteUsuarioCreationAttributes extends Optional<ClienteUsuarioAttributes, 'id' | 'fecha_vinculacion' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class ClienteUsuario extends Model<ClienteUsuarioAttributes, ClienteUsuarioCreationAttributes> implements ClienteUsuarioAttributes {
  public id!: number;
  public usuario_id!: number;
  public cliente_id!: number;
  public fecha_vinculacion?: Date;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

ClienteUsuario.init(
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
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    fecha_vinculacion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'cliente_usuario',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['usuario_id']
      },
      {
        unique: true,
        fields: ['cliente_id']
      }
    ]
  }
);

export default ClienteUsuario;

