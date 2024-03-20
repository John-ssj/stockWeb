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

const getStockSummaryCharts = async (stock, t) => {
  const time_to = t.toISOString().split('T')[0];
  t.setDate(t.getDate() - 1);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://api.polygon.io/v2/aggs/ticker/${stock}/range/60/minute/${time_from}/${time_to}?adjusted=true&sort=asc&apiKey=${api_key_polygon}`;
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      extracted_data = data.results.map(item => {
        return [item.t, Number(item.vw.toFixed(2))]
      });
      selected_data = extracted_data.length <= 24 ? extracted_data : extracted_data.slice(-24);
      return selected_data;
    }
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
}

// 这些函数应该在调用前确保stock值有效
const getStockDetailAndSummary = async (stock) => {
  const target_url_1 = `https://finnhub.io/api/v1/stock/profile2?symbol=${stock}&token=${api_key_finnhub}`;
  const target_url_2 = `https://finnhub.io/api/v1/quote?symbol=${stock}&token=${api_key_finnhub}`;
  const target_url_3 = `https://finnhub.io/api/v1/stock/peers?symbol=${stock}&token=${api_key_finnhub}`;
  try {
    const response_1 = await fetch(target_url_1);
    const data_1 = await response_1.json();
    const response_2 = await fetch(target_url_2);
    const data_2 = await response_2.json();
    const response_3 = await fetch(target_url_3);
    const data_3 = await response_3.json();
    if (Object.keys(data_1).length === 0 || Object.keys(data_2).length === 0 || Object.keys(data_3).length === 0) {
      return {};
    } else {
      const date = new Date(data_2["t"] * 1000);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffMinutes = Math.abs(diff) / (1000 * 60);
      const marketStatus = diffMinutes <= 5;

      const summaryCharts = await getStockSummaryCharts(stock, date);

      const output_data_3 = data_3.filter(str => /^[A-Za-z]+$/.test(str));

      const outputData = {
        "detail": {
          "logo": data_1["logo"],
          "symbol": data_1["ticker"],
          "name": data_1["name"],
          "code": data_1["exchange"],
          "lastPrice": data_2["c"],
          "change": data_2["d"],
          "changePercent": Number(data_2["dp"].toFixed(2)),
          "timestamp": data_2["t"] + '000',
          "status": marketStatus
        },
        "summary": {
          "highPrice": Number(data_2["h"].toFixed(2)),
          "lowPrice": Number(data_2["l"].toFixed(2)),
          "openPrice": Number(data_2["o"].toFixed(2)),
          "prevClose": Number(data_2["pc"].toFixed(2)),
          "ipo": data_1["ipo"],
          "industry": data_1["finnhubIndustry"],
          "webpage": data_1["weburl"],
          "peers": output_data_3
        },
        "summaryCharts": summaryCharts
      };
      return outputData;
    }
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

const getStockNews = async (stock) => { };

const getStockCharts = async (stock) => {
  t = new Date();
  const time_to = t.toISOString().split('T')[0];
  t.setFullYear(t.getFullYear() - 2);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://api.polygon.io/v2/aggs/ticker/${stock}/range/1/day/${time_from}/${time_to}?adjusted=true&sort=asc&apiKey=${api_key_polygon}`;
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      ohlc = data.results.map(item => {
        return [item.t, Number(item.o.toFixed(2)), Number(item.h.toFixed(2)), Number(item.l.toFixed(2)), Number(item.c.toFixed(2))]
      });
      volume = data.results.map(item => {
        return [item.t, Number(item.v.toFixed(2))]
      });
      extracted_data = {
        "ohlc": ohlc,
        "volume": volume
      };
      return extracted_data;
    }
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

const getStockInsights = async (stock) => { };

app.get('/stock/company', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    return_data = await getStockDetailAndSummary(symbol);
    stockCharts_data = await getStockCharts(symbol);
    return_data["charts"] = stockCharts_data;
    return res.json(return_data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({});
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
