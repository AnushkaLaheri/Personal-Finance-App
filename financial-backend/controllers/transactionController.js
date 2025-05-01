const Transaction = require('../models/Transaction');
const { createNotification } = require('./notificationController');

exports.addTransaction = async (req, res) => {
    const { type, amount, description, date } = req.body;
    try {
        const transaction = new Transaction({
            user: req.user.id,
            type,
            amount,
            description,
            date
        });
        await transaction.save();

        // Notify user of new transaction
        await createNotification({
            userId: req.user.id,
            message: `New ${type} transaction: ${description} ($${amount})`,
            type: 'transaction',
            transactionId: transaction._id
        });

        // Check if the user's expenses exceeded a predefined budget
        const totalExpenses = await Transaction.aggregate([
            { $match: { user: req.user.id, type: 'expense' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const userBudget = req.user.budget; // Assuming `budget` is part of the user model
        if (totalExpenses[0]?.total > userBudget) {
            createNotification(req.user.id, "You've exceeded your budget for the month!");
        }

        res.status(201).json(transaction);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await transaction.deleteOne();
        res.status(200).json({ message: 'Transaction deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTransaction = async (req, res) => {
  try {
    const { description, amount, date, category } = req.body;
    const transaction = new Transaction({
      description,
      amount,
      date,
      category,
      currency: 'INR', // Ensure currency is set to INR
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
