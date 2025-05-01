const express = require('express');
const router = express.Router();

// Mock data for savings
const savingsData = {
  savings: 1570.00,
  savingsIncrease: 470.00,
};

// GET /savings - Retrieve savings data
router.get('/', (req, res) => {
  res.json(savingsData);
});

module.exports = router;