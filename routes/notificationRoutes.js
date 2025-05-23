const express = require('express');

const {
    // createNotificationForCustomer,
     createNotificationForVendor,
    getNotificationsForCustomer,
    getNotificationsForVendor,
    deleteNotification,
    deleteBatchNotifications,

} = require('../controllers/notificationController');

const router = express.Router();

const authMiddleware  = require('../middleware/authMiddleware');


// Create notifications for Vendor by the Customer
router.post('/createNotificationsForVendor',authMiddleware, createNotificationForVendor );
// Get notifications for Vendor
router.get('/vendorId',authMiddleware, getNotificationsForVendor);
// Get notifications for Customer
router.get('/userId',authMiddleware, getNotificationsForCustomer);
//Delete a single Notification
router.delete("/:id",authMiddleware, deleteNotification); 

router.post("/batch-delete",authMiddleware, deleteBatchNotifications);

module.exports = router;