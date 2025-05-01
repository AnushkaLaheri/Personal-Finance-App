const express = require('express');
const { getNotifications, markAsSeen, markAllAsSeen } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const mongoose = require('mongoose'); // <-- Add this import

const router = express.Router();

router.get('/', protect, getNotifications);
// Move this route ABOVE the '/:id' route:
router.put('/markAsSeen', protect, markAllAsSeen);
router.put('/:id', protect, markAsSeen);
router.post('/', protect, async (req, res) => {
  try {
    const { message, type, goalId, transactionId } = req.body;
    if (!message || !type) {
      return res.status(400).json({ message: "Message and type are required" });
    }
    const Notification = require('../models/Notification');
    const notification = new Notification({
      user: req.user.id,
      message,
      type,
      goalId,
      transactionId
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
