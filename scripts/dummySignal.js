// backend/scripts/createDummyData.js
import sequelize from '../backend/config/db.js';
import User from '../backend/models/User.js';
import Signal from '../backend/models/Signal.js';
import bcrypt from 'bcryptjs';

const createDummyData = async () => {
  try {
    console.log('🔄 Creating dummy data...');

    // Create test users
    const users = await User.bulkCreate([
      {
        username: 'trader_user',
        password: await bcrypt.hash('123456', 10),
        role: 'user',
        fullname: 'Trader User'
      },
      {
        username: 'pro_callmaker',
        password: await bcrypt.hash('123456', 10),
        role: 'callmaker', 
        fullname: 'Professional Callmaker'
      },
      {
        username: 'system_admin',
        password: await bcrypt.hash('123456', 10),
        role: 'admin',
        fullname: 'System Administrator'
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Users created');

    // Create dummy signals
    const signals = await Signal.bulkCreate([
      {
        coin_name: 'BTC/USDT',
        entry_price: 42500.50,
        target_price: 43800.00,
        stop_loss: 41800.00,
        note: 'Bullish breakout expected after consolidation',
        status: 'approved',
        created_by: users[1].id // callmaker
      },
      {
        coin_name: 'ETH/USDT', 
        entry_price: 2250.75,
        target_price: 2350.00,
        stop_loss: 2180.00,
        note: 'Strong support at 2200, targeting resistance',
        status: 'approved',
        created_by: users[1].id
      },
      {
        coin_name: 'ADA/USDT',
        entry_price: 0.4850,
        target_price: 0.5200,
        stop_loss: 0.4650,
        note: 'Potential 8% gain from current levels',
        status: 'pending',
        created_by: users[1].id
      },
      {
        coin_name: 'SOL/USDT',
        entry_price: 98.50,
        target_price: 105.00, 
        stop_loss: 92.00,
        note: 'Breaking key resistance level',
        status: 'rejected',
        created_by: users[1].id
      },
      {
        coin_name: 'XRP/USDT',
        entry_price: 0.6250,
        target_price: 0.6800,
        stop_loss: 0.5900,
        note: 'Legal clarity driving momentum',
        status: 'approved', 
        created_by: users[2].id // admin
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Signals created');
    console.log('🎉 Dummy data setup complete!');
    
    console.log('\n📋 TEST CREDENTIALS:');
    console.log('User: trader_user / 123456 (can view approved signals only)');
    console.log('Callmaker: pro_callmaker / 123456 (can create signals)');
    console.log('Admin: system_admin / 123456 (can approve/reject signals)');

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
  } finally {
    process.exit();
  }
};

// Run the script
createDummyData();