const express = require('express');
const app = express();
const port = 8080;

const api_key_finnhub = 'cn83jf1r01qplv1ek8f0cn83jf1r01qplv1ek8fg';
const api_key_polygon = 'Rs6kySvg5Yir8e50SPLKAYW9gZXV7Ovr';

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/stock/company', async (req, res) => {
  // 检查symbol参数是否存在
  if (!req.query.symbol) {
    return res.status(400).json({});
  }
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.toUpperCase() : '';
  if (!symbol) {
    return res.status(400).json({});
  }

  const target_url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${api_key_finnhub}`;

  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      res.json({});
    } else {
      const requiredData = {
        "logo": data["logo"],
        "name": data["name"],
        "symbol": data["ticker"],
        "code": data["exchange"],
        "date": data["ipo"],
        "category": data["finnhubIndustry"]
      };
      res.json(requiredData);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
