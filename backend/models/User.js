// models/User.js - SESUAIKAN DENGAN DATABASE
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER, // ✅ INTEGER, bukan UUID
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'callmaker', 'user'),
    defaultValue: 'user',
  },
  fullname: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt', // ✅ Match dengan nama kolom di database
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updatedAt', // ✅ Match dengan nama kolom di database
  },
}, {
  tableName: 'users',
  timestamps: true, // ✅ Sequelize akan handle createdAt/updatedAt otomatis
});

export default User;