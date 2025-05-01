const express = require('express');
const { registerUser, loginUser, getUserProfile, updateProfile, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const User = require('../models/User');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/preferences', protect, updatePreferences);
//router.put('/profile', protect, updateProfile); // Add this line for profile updates

router.put('/profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      bio: req.body.bio,
    };

    if (req.file) {
      updateData.profilePicture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      console.log("Saving profilePicture:", updateData.profilePicture);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    console.log("Returning user.profilePicture:", user.profilePicture);
    res.json(user);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
