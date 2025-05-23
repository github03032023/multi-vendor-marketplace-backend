
const PlatformSettings = require('../models/commissionSettingsModel');
const calculateVendorEarnings = async(subTotal) => {
    
    const settings = await PlatformSettings.findOne();
    console.log("Commission Percent val-",settings.commissionPercent);
    const commission = (subTotal * (settings?.commissionPercent || 5)) / 100;
    return parseFloat((subTotal - commission).toFixed(2));
  }
  
module.exports = {calculateVendorEarnings};