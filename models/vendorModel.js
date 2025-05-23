const mongoose = require('mongoose');

// Sub-schema for Company Details
const companyDetailsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyAddress: {
        street: { type: String },
        city: { type: String },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    companyType: {
        type: String,
        enum: ['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'Other'],
        required: true
    }
});

// Sub-schema for Bank Account
const bankAccountSchema = new mongoose.Schema({
    accountHolderName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    ifscCode: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    branchName: {
        type: String,
        required: true,
        trim: true
    }
});


// Main Vendor Schema
const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: false
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: false
    },
    homeaddress: {
        street: { type: String },
        city: { type: String },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    companyDetails: {
        type: companyDetailsSchema,
        required: true
    },
    bankAccount: {
        type: bankAccountSchema,
        required: true
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
    totalEarned: {
        type: Number,
        default: 0,
    },
    isVerified: { type: Boolean, default: false },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: Boolean,
        default: false // only admins can approve after registration
    }
}, { timestamps: true });

// Create and export the Vendor model
const VendorModel = mongoose.model("vendors", vendorSchema);
module.exports = VendorModel;
