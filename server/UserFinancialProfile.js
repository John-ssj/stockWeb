const mongoose = require('mongoose');
const { Schema } = mongoose;

// 定义观察列表项的Schema
const watchListItemSchema = new Schema({
  stock: String, // 股票代码
  name: String,  // 股票名称
});

// 定义投资组合项的Schema
const portfolioItemSchema = new Schema({
  stock: String,     // 股票代码
  name: String,      // 股票名称
  quantity: Number,  // 持股数量
  totalCost: Number, // 总成本
});

// 定义用户金融投资概况的Schema
const userFinancialProfileSchema = new Schema({
  wallet: {
    type: Number,
    default: 0,  // 默认钱包余额为0
  },
  watchList: [watchListItemSchema], // 观察列表，数组形式
  portfolio: [portfolioItemSchema], // 投资组合，数组形式
});

// 创建模型
const UserFinancialProfile = mongoose.model('UserFinancialProfile', userFinancialProfileSchema);

module.exports = UserFinancialProfile;
