const express = require('express');
const { addTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, addTransaction)
    .get(protect, getTransactions);

router.route('/:id')
    .delete(protect, deleteTransaction);

module.exports = router;
