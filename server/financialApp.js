const express = require('express');

const bodyParser = require('body-parser');



const app = express();
const port = 3000;

app.use(bodyParser.json());

// 获取wallet的余额
app.get('/financial/getWallet', async (req, res) => {
  const profile = await UserFinancialProfile.findOne();
  if (profile) {
    res.json({ "wallet": profile.wallet });
  } else {
    res.status(404).send('Profile not found');
  }
});

// 获取WatchList数组
app.get('/financial/getWatchList', async (req, res) => {
  const profile = await UserFinancialProfile.findOne();
  if (profile) {
    return_data = profile.watchList.map((item) => {
        
    });
    res.json({ "watchList": profile.watchList });
  } else {
    res.status(404).send('Profile not found');
  }
});

// 获取Portfolio数组
app.get('/financial/getPortfolio', async (req, res) => {
  const profile = await UserFinancialProfile.findOne();
  if (profile) {
    res.json({ "portfolio": profile.portfolio });
  } else {
    res.status(404).send('Profile not found');
  }
});

// 在WatchList数组中添加
app.post('/financial/addWatchList', async (req, res) => {
  const { stock, name } = req.body;
  const result = await UserFinancialProfile.updateOne({}, {
    $push: { watchList: { stock, name } }
  });
  res.json({ "success": result.nModified > 0 });
});

// 在WatchList数组中删除
app.post('/financial/removeWatchList', async (req, res) => {
  const { stock } = req.body;
  const result = await UserFinancialProfile.updateOne({}, {
    $pull: { watchList: { stock } }
  });
  res.json({ "success": result.nModified > 0 });
});

// 买入股票
app.post('/financial/buy', async (req, res) => {
  const { stock, name, quantity, totalCost } = req.body;
  const profile = await UserFinancialProfile.findOne();
  if (profile.wallet >= totalCost) {
    // 扣除wallet
    profile.wallet -= totalCost;
    // 更新portfolio
    profile.portfolio.push({ stock, name, quantity, totalCost });
    await profile.save();
    res.json({ "success": true });
  } else {
    res.json({ "success": false });
  }
});

// 卖出股票
app.post('/financial/sell', async (req, res) => {
  const { stock, quantity, totalCost } = req.body;
  const profile = await UserFinancialProfile.findOne();
  // 假设每次卖出都是成功的
  profile.wallet += totalCost;
  // 这里应该更精确地更新portfolio，但为了简单，我们假设总能卖出
  await profile.save();
  res.json({ "success": true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
