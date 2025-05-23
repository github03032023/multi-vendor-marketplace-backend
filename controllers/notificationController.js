const Notification = require('../models/notificationModel');

const createNotificationForCustomer = async (req, res) => {
    const { type, message } = req.body;
    const customerId = req.userId;
    try {
        const notification = new Notification({
            userId: customerId,      // Reference to customer
            userType: 'customers',   // Specify it's for a customer
            type,
            message,
        });
        await notification.save();
        console.log('Notification created successfully');
    } catch (error) {
        console.error('Error creating notification', error);
    }
};

// const createNotificationForVendor = async (vendorId, type, message) => {
const createNotificationForVendor = async (req, res) => {
    const { type, message, vendorId } = req.body;
    if (!vendorId || !type || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const notification = new Notification({
            userId: vendorId,      // Reference to vendor
            userType: 'vendors',   // Specify it's for a vendor
            type,
            message,
        });
        await notification.save();
        res.status(201).json({ success: true, message: 'Notification created successfully' });
    } catch (error) {
        console.error('Error creating notification', error);
        res.status(500).json({ error: 'Server error creating notification' });
    }
};


// Get notifications for a customer
const getNotificationsForCustomer = async (req, res) => {
    try {
        const userId = req.userId;
        const notifications = await Notification.find({ userId: userId, userType: 'customers' }).populate('userId')
            .sort({ createdAt: -1 }) // Sort notifications by the most recent first
            .limit(50); //
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notification', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }

};


const getNotificationsForVendor = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const notifications = await Notification.find({ userId: vendorId, userType: 'vendors' }).populate('userId')
            .sort({ createdAt: -1 }) // Sort notifications by the most recent first
            .limit(50); //
        console.log("notifications-", notifications);
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notification', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }

};


// PATCH /notifications/:id/markAsRead
const setNotificationsMarkAsRead = async (vendorId) => {
    router.patch('/notifications/:id/markAsRead', async (req, res) => {
        try {
            const notification = await Notification.findById(req.params.id);

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            notification.read = true;
            await notification.save();

            res.status(200).json({ message: 'Notification marked as read' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    });
};



// DELETE single notification

const deleteNotification = async (req, res) =>{ 
try {
    const result = await Notification.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
} catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
}
  };

// POST batch delete
  
const deleteBatchNotifications = async (req, res) =>{ 
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid notification IDs" });
        }

        await Notification.deleteMany({ _id: { $in: ids } });
        res.json({ message: "Batch delete successful" });
    } catch (err) {
        console.error("Batch delete error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createNotificationForCustomer,
    createNotificationForVendor,
    getNotificationsForCustomer,
    getNotificationsForVendor,
    setNotificationsMarkAsRead,
    deleteNotification,
    deleteBatchNotifications
};