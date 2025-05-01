const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Function to calculate financial reports (e.g., income, expenses, balance)
exports.getReport = async (req, res) => {
    const { startDate, endDate } = req.query; // Optional query params to filter by date range

    const filter = { user: req.user.id };

    // Add date range filter if provided
    if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    try {
        const transactions = await Transaction.find(filter);

        // Calculate income, expenses, and balance for the filtered transactions
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        const balance = income - expenses;

        res.status(200).json({
            income,
            expenses,
            balance,
            transactions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), type: 'expense' } },
      { $group: { _id: "$description", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);
    res.json(expenses);
  } catch (err) {
    console.error('Error in getExpensesByCategory:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $month: "$date" },
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
            }
          }
        }
      },
      {
        $project: {
          name: {
            $let: {
              vars: {
                months: [
                  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ]
              },
              in: { $arrayElemAt: ["$$months", "$_id"] }
            }
          },
          income: 1,
          expenses: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);
    res.json(summary);
  } catch (err) {
    console.error('Error in getMonthlySummary:', err);
    res.status(500).json({ message: err.message });
  }
};
