import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MarcaAttributes {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

interface MarcaCreationAttributes extends Optional<MarcaAttributes, 'id' | 'activo' | 'fecha_creacion' | 'fecha_actualizacion'> {}

class Marca extends Model<MarcaAttributes, MarcaCreationAttributes> implements MarcaAttributes {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
  public activo!: boolean;
  public readonly fecha_creacion!: Date;
  public readonly fecha_actualizacion!: Date;
}

Marca.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
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
    tableName: 'marcas',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    underscored: true
  }
);

export default Marca;
