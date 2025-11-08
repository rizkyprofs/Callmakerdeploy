import express from 'express';
import Signal from '../models/Signal.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// GET all signals
router.get('/', authenticate, async (req, res) => {
  try {
    const signals = await Signal.findAll({ order: [['created_at', 'DESC']] });
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE signal  
router.post('/', authenticate, async (req, res) => {
  try {
    const { coin_name, entry_price, target_price, stop_loss, note } = req.body;
    
    const signal = await Signal.create({
      coin_name,
      entry_price,
      target_price,
      stop_loss,
      note,
      created_by: req.user.id,
      status: 'pending'
    });

    res.status(201).json(signal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE signal status (approve/reject)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🟢 PATCH status endpoint called:', id, status);
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const signal = await Signal.findByPk(id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    signal.status = status;
    await signal.save();

    res.json(signal);
  } catch (error) {
    console.error('🔴 Status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE signal (edit)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { coin_name, entry_price, target_price, stop_loss, note } = req.body;
    
    console.log('🟢 PUT endpoint called:', id);
    
    const signal = await Signal.findByPk(id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    // Cek ownership
    if (signal.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this signal' });
    }

    signal.coin_name = coin_name;
    signal.entry_price = entry_price;
    signal.target_price = target_price;
    signal.stop_loss = stop_loss;
    signal.note = note;
    
    await signal.save();

    res.json(signal);
  } catch (error) {
    console.error('🔴 Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE signal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🟢 DELETE endpoint called with ID:', id);
    
    const signal = await Signal.findByPk(id);
    
    if (!signal) {
      console.log('🔴 Signal not found with ID:', id);
      return res.status(404).json({ error: 'Signal not found' });
    }

    console.log('🟢 Signal found:', signal.coin_name);
    console.log('🟢 User role:', req.user.role);
    console.log('🟢 Signal created_by:', signal.created_by);
    console.log('🟢 Current user ID:', req.user.id);

    // Cek ownership (hanya creator atau admin yang bisa delete)
    if (signal.created_by !== req.user.id && req.user.role !== 'admin') {
      console.log('🔴 Not authorized to delete');
      return res.status(403).json({ error: 'Not authorized to delete this signal' });
    }

    await signal.destroy();
    console.log('🟢 Signal deleted successfully');
    res.json({ message: 'Signal deleted successfully' });
    
  } catch (error) {
    console.error('🔴 Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;