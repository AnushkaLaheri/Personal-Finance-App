const Notification = require('../models/Notification');

// Create a new notification
exports.createNotification = async ({ userId, message, type, goalId = null, transactionId = null }) => {
    const notification = new Notification({
        user: userId,
        message,
        type,
        goalId,
        transactionId
    });
    await notification.save();
};

// Get all notifications for the user (most recent first)
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mark notification as seen
exports.markAsSeen = async (req, res) => {
    try {
        console.log('Request received to mark notifications as seen');
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        console.log('Found notification:', notification);
        notification.seen = true;
        await notification.save();
        console.log('Notification marked as seen');
        res.status(200).json(notification);
    } catch (err) {
        console.error('Error in markAsSeen:', err);
        res.status(500).json({ message: err.message });
    }
};



exports.markAllAsSeen = async (req, res) => {
    try {
        console.log("req.user in markAllAsSeen:", req.user); // Debug log
        const result = await Notification.updateMany(
            { user: req.user.id, seen: false },
            { $set: { seen: true } }
        );
        console.log("updateMany result:", result); // Debug log
        res.status(200).json({ message: `${result.modifiedCount} notifications marked as seen` });
    } catch (err) {
        console.log("Error marking all notifications as seen:", err);
        res.status(500).json({ message: err.message });
    }
};
