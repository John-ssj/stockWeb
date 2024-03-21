const mongoose = require('mongoose');
const { Schema } = mongoose;

const watchListItemSchema = new Schema({
    stock: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    }
});

const portfolioItemSchema = new Schema({
    stock: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    },
});

const userFinancialProfileSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    wallet: {
        type: Number,
        default: 25000,
    },
    watchList: {
        type: [watchListItemSchema],
        required: true,
        default: []
    },
    portfolio: {
        type: [portfolioItemSchema],
        required: true,
        default: []
    },
});

const UserFinancialProfile = mongoose.model('UserFinancialProfile', userFinancialProfileSchema);

module.exports = UserFinancialProfile;
