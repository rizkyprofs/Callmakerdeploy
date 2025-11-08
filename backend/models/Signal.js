// models/Signal.js - SESUAIKAN DENGAN DATABASE
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Signal = sequelize.define('Signal', {
  id: {
    type: DataTypes.INTEGER, // ✅ INTEGER, bukan UUID
    primaryKey: true,
    autoIncrement: true,
  },
  coin_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entry_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  target_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stop_loss: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chart_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  created_by: {
    type: DataTypes.INTEGER, // ✅ INTEGER foreign key
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at', // ✅ Match dengan nama kolom
  },
}, {
  tableName: 'signals',
  timestamps: false, // ✅ Nonaktifkan timestamps otomatis karena kita punya created_at manual
});

export default Signal;