const Goal = require('../models/Goal');
const { createNotification } = require('../controllers/notificationController');

exports.createGoal = async (req, res) => {
    const { title, targetAmount, deadline } = req.body;

    try {
        const goal = new Goal({
            user: req.user.id,
            title,
            targetAmount,
            deadline
        });
        await goal.save();
        res.status(201).json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });
        res.status(200).json(goals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { savedAmount, title, targetAmount, deadline } = req.body;
        let notifyType = null;
        let notifyMsg = null;

        if (savedAmount !== undefined) {
            goal.savedAmount = savedAmount;

            // Completed
            if (goal.savedAmount >= goal.targetAmount) {
                notifyType = 'completed';
                notifyMsg = `Congratulations! You completed your goal: "${goal.title}".`;
            }
            // 90% or more
            else if (goal.savedAmount >= goal.targetAmount * 0.9) {
                notifyType = 'info';
                notifyMsg = `You're 90% of the way to your goal: "${goal.title}".`;
            }
            // At risk (progress < expected for time left)
            else if (goal.deadline) {
                const now = new Date();
                const totalDuration = new Date(goal.deadline) - new Date(goal.createdAt);
                const elapsed = now - new Date(goal.createdAt);
                const expectedProgress = elapsed / totalDuration;
                const actualProgress = goal.savedAmount / goal.targetAmount;
                if (elapsed > 0 && totalDuration > 0 && actualProgress < expectedProgress - 0.1) {
                    notifyType = 'warning';
                    notifyMsg = `Your goal "${goal.title}" is at risk. Consider increasing your savings.`;
                }
            }
        }
        if (title) goal.title = title;
        if (targetAmount) goal.targetAmount = targetAmount;
        if (deadline) goal.deadline = deadline;

        // Deadline approaching (less than 7 days)
        if (goal.deadline) {
            const now = new Date();
            const deadlineDate = new Date(goal.deadline);
            const diffDays = (deadlineDate - now) / (1000 * 60 * 60 * 24);
            if (diffDays > 0 && diffDays <= 7) {
                notifyType = 'warning';
                notifyMsg = `Only ${Math.ceil(diffDays)} days left to reach your goal "${goal.title}".`;
            }
        }

        await goal.save();

        // Send notification if needed
        if (notifyType && notifyMsg) {
            await createNotification({
                userId: req.user.id,
                message: notifyMsg,
                type: notifyType,
                goalId: goal._id
            });
        }

        res.status(200).json(goal);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await goal.deleteOne();
        res.status(200).json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
