// controllers/adminController.js
const commissionSettings = require('../models/commissionSettingsModel');

exports.getCommission = async (req, res) => {
    try {
        const settings = await commissionSettings.findOne();
        res.json({ commissionPercent: settings?.commissionPercent || 5 });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
    }
};

exports.updateCommission = async (req, res) => {
    try {
        const { commissionPercent } = req.body;
        if (typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
            return res.status(400).json({ error: 'Invalid commission value' });
        }

        const settings = await commissionSettings.findOneAndUpdate(
            {},
            { commissionPercent, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json({ message: 'Commission updated', settings });
    } catch (error) {
        console.log(error);
        res.status(error.status || 500).json({ error: error.message || "Internal Server Error" });
    }
};
