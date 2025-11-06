import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Usuario from './Usuario';

interface PasswordResetTokenAttributes {
  id: number;
  usuario_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  fecha_creacion?: Date;
}

interface PasswordResetTokenCreationAttributes extends Optional<PasswordResetTokenAttributes, 'id' | 'used' | 'fecha_creacion'> {}

class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes> implements PasswordResetTokenAttributes {
  public id!: number;
  public usuario_id!: number;
  public token!: string;
  public expires_at!: Date;
  public used!: boolean;
  public readonly fecha_creacion!: Date;

  // Relaciones
  public usuario?: Usuario;
}

PasswordResetToken.init(
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
      }
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'password_reset_tokens',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
    underscored: true
  }
);

export default PasswordResetToken;

