const express = require('express');
const { getReport, getExpensesByCategory, getMonthlySummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getReport);  // Allows filtering by date range

// Add these endpoints:
router.get('/expenses-by-category', protect, getExpensesByCategory);
router.get('/monthly-summary', protect, getMonthlySummary);

module.exports = router;
