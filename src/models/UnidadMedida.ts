import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UnidadMedidaAttributes {
  id: number;
  nombre: string;
  abreviatura: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface UnidadMedidaCreationAttributes extends Optional<UnidadMedidaAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class UnidadMedida extends Model<UnidadMedidaAttributes, UnidadMedidaCreationAttributes> implements UnidadMedidaAttributes {
  public id!: number;
  public nombre!: string;
  public abreviatura!: string;
  public descripcion?: string;
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

UnidadMedida.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    abreviatura: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'unidades_medida',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default UnidadMedida;
