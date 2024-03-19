const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors());

const api_key_finnhub = 'cn83jf1r01qplv1ek8f0cn83jf1r01qplv1ek8fg';
const api_key_polygon = 'Rs6kySvg5Yir8e50SPLKAYW9gZXV7Ovr';

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/stock/search', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  const target_url = `https://finnhub.io/api/v1/search?q=${symbol}&token=${api_key_finnhub}`;
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      res.json({});
    } else {
      const requiredData = data.result.filter(item => /^[A-Za-z]+$/.test(item.symbol)).map(item => ({
        description: item.description,
        symbol: item.symbol
      })).sort((a, b) => a.symbol.localeCompare(b.symbol));
      res.json(requiredData);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({});
  }
});

app.get('/stock/company', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

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
    res.status(500).json({});
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
