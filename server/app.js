'use strict';

// [START app]
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const UserFinancialProfile = require('./UserFinancialProfile.js');

// MongoDB 连接
mongoose.connect('mongodb+srv://hayleyliu:InB2FwIu9o1Ny3hU@stockwebdb.k3nzcez.mongodb.net/StockWeb?retryWrites=true&w=majority&appName=stockWebDB', {
  useNewUrlParser: true
});

const app = express();

app.use(cors());

const api_key_finnhub = 'cn83jf1r01qplv1ek8f0cn83jf1r01qplv1ek8fg';
const api_key_polygon = 'Rs6kySvg5Yir8e50SPLKAYW9gZXV7Ovr';

function formatDate(date) {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}, ${year}`;
}

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

async function getStockSummaryCharts(stock, date) {
  const t = new Date(Number(date));
  const time_to = t.toISOString().split('T')[0];
  t.setDate(t.getDate() - 1);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://api.polygon.io/v2/aggs/ticker/${stock}/range/60/minute/${time_from}/${time_to}?adjusted=true&sort=asc&apiKey=${api_key_polygon}`;
  let data = {};
  try {
    const response = await fetch(target_url);
    data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      const extracted_data = data.results.map(item => {
        return [item.t, Number(item.vw.toFixed(2))]
      });
      const selected_data = extracted_data.length <= 24 ? extracted_data : extracted_data.slice(-24);
      return selected_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(data);
    return {};
  }
}

// 这些函数应该在调用前确保stock值有效
async function getStockDetailAndSummary(stock) {
  const target_url_1 = `https://finnhub.io/api/v1/stock/profile2?symbol=${stock}&token=${api_key_finnhub}`;
  const target_url_2 = `https://finnhub.io/api/v1/quote?symbol=${stock}&token=${api_key_finnhub}`;
  const target_url_3 = `https://finnhub.io/api/v1/stock/peers?symbol=${stock}&token=${api_key_finnhub}`;
  try {
    const [response_1, response_2, response_3] = await Promise.all([
      fetch(target_url_1),
      fetch(target_url_2),
      fetch(target_url_3)
    ]);
    const [data_1, data_2, data_3] = await Promise.all([
      response_1.json(),
      response_2.json(),
      response_3.json()
    ]);
    if (Object.keys(data_1).length === 0 || Object.keys(data_2).length === 0 || Object.keys(data_3).length === 0) {
      return {};
    } else {
      const date = new Date(data_2["t"] * 1000);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffMinutes = Math.abs(diff) / (1000 * 60);
      const marketStatus = diffMinutes <= 5;

      const output_data_3 = data_3.filter(str => /^[A-Za-z]+$/.test(str));

      const outputData = {
        "detail": {
          "logo": data_1["logo"],
          "symbol": data_1["ticker"],
          "name": data_1["name"],
          "code": data_1["exchange"],
          "lastPrice": data_2["c"].toFixed(2),
          "change": data_2["d"] ? data_2["d"].toFixed(2) : "0.00",
          "changePercent": data_2["dp"] ? data_2["dp"].toFixed(2) : "0.00",
          "timestamp": data_2["t"] + '000',
          "status": marketStatus
        },
        "summary": {
          "highPrice": data_2["h"].toFixed(2),
          "lowPrice": data_2["l"].toFixed(2),
          "openPrice": data_2["o"].toFixed(2),
          "prevClose": data_2["pc"].toFixed(2),
          "ipo": data_1["ipo"],
          "industry": data_1["finnhubIndustry"],
          "webpage": data_1["weburl"],
          "peers": output_data_3
        }
      };
      return outputData;
    }
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
};

async function getStockNews(stock) {
  let t = new Date();
  const time_to = t.toISOString().split('T')[0];
  t.setDate(t.getDate() - 7);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://finnhub.io/api/v1/company-news?symbol=${stock}&from=${time_from}&to=${time_to}&token=${api_key_finnhub}`;
  let selected_data = {};
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      return [];
    } else {
      const filtered_data = data.filter(item =>
        item.headline && item.image && item.source && item.datetime && item.summary && item.url
      );
      selected_data = filtered_data.length <= 20 ? filtered_data : filtered_data.slice(0, 20);
      const extracted_data = selected_data.map(item => {
        const formattedDate = formatDate(new Date(item.datetime * 1000));
        return {
          "headline": item.headline,
          "image": item.image,
          "source": item.source,
          "datetime": formattedDate,
          "summary": item.summary,
          "url": item.url,
        }
      });;
      return extracted_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(selected_data);
    return {};
  }
};

async function getStockCharts(stock) {
  let t = new Date();
  const time_to = t.toISOString().split('T')[0];
  t.setFullYear(t.getFullYear() - 2);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://api.polygon.io/v2/aggs/ticker/${stock}/range/1/day/${time_from}/${time_to}?adjusted=true&sort=asc&apiKey=${api_key_polygon}`;
  let data = {};
  try {
    const response = await fetch(target_url);
    data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      const ohlc = data.results.map(item => {
        return [item.t, Number(item.o.toFixed(2)), Number(item.h.toFixed(2)), Number(item.l.toFixed(2)), Number(item.c.toFixed(2))]
      });
      const volume = data.results.map(item => {
        return [item.t, Number(item.v.toFixed(2))]
      });
      return {
        "ohlc": ohlc,
        "volume": volume
      };
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(data);
    return {};
  }
};

async function getStockInsights(stock) {
  const target_url = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${stock}&from=2022-01-01&token=${api_key_finnhub}`;
  let filtered_data = {};
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      filtered_data = data.data.filter(item =>
        item.mspr && item.change
      );
      let totalMspr = 0, positiveMspr = 0, negativeMspr = 0;
      let totalChange = 0, positiveChange = 0, negativeChange = 0;

      filtered_data.forEach(item => {
        totalMspr += item.mspr;
        totalChange += item.change;

        if (item.mspr > 0) positiveMspr += item.mspr;
        if (item.mspr < 0) negativeMspr += item.mspr;

        if (item.change > 0) positiveChange += item.change;
        if (item.change < 0) negativeChange += item.change;
      });

      const extracted_data = {
        "totalMspr": totalMspr.toFixed(2),
        "positiveMspr": positiveMspr.toFixed(2),
        "negativeMspr": negativeMspr.toFixed(2),
        "totalChange": totalChange.toFixed(2),
        "positiveChange": positiveChange.toFixed(2),
        "negativeChange": negativeChange.toFixed(2)
      }
      return extracted_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(filtered_data);
    return {};
  }
};

async function getStockInsightsTrendsCharts(stock) {
  const target_url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${stock}&token=${api_key_finnhub}`;
  let data = {};
  try {
    const response = await fetch(target_url);
    data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      let period_list = [];
      let buy = [];
      let hold = [];
      let sell = [];
      let strongBuy = [];
      let strongSell = [];

      data.forEach(item => {
        const period = item.period.substring(0, 7);
        period_list.push(period);
        buy.push(item.buy);
        hold.push(item.hold);
        sell.push(item.sell);
        strongBuy.push(item.strongBuy);
        strongSell.push(item.strongSell);
      });

      const selected_data = {
        "period": period_list,
        "buy": buy,
        "hold": hold,
        "sell": sell,
        "strongBuy": strongBuy,
        "strongSell": strongSell
      };

      return selected_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(data);
    return {};
  }
}

async function getStockInsightsEPSCharts(stock) {
  const target_url = `https://finnhub.io/api/v1/stock/earnings?symbol=${stock}&token=${api_key_finnhub}`;
  let data = {};
  try {
    const response = await fetch(target_url);
    data = await response.json();
    if (Object.keys(data).length === 0) {
      return {};
    } else {
      let periodAndSurprise_list = [];
      let actual = [];
      let estimate = [];

      data.forEach(item => {
        periodAndSurprise_list.push(item.period + "<br>surprise: " + (item.surprise ? item.surprise : 0));
        actual.push(item.actual ? item.actual : 0);
        estimate.push(item.estimate);
      });
      const selected_data = {
        "periodAndSurprise": periodAndSurprise_list,
        "actual": actual,
        "estimate": estimate
      };

      return selected_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(data);
    return {};
  }
}

app.get('/stock/company', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    let return_data = await getStockDetailAndSummary(symbol);
    if (Object.keys(return_data).length === 0) {
      return res.json({});
    }

    const [summaryCharts, stockNews_data, stockCharts_data, stockInsights_data, stockInsightsTrendsCharts_data, stockInsightsEPSCharts_data] = await Promise.all([
      getStockSummaryCharts(symbol, return_data.detail.timestamp),
      getStockNews(symbol),
      getStockCharts(symbol),
      getStockInsights(symbol),
      getStockInsightsTrendsCharts(symbol),
      getStockInsightsEPSCharts(symbol),
    ]);

    return_data["summaryCharts"] = summaryCharts
    return_data["news"] = stockNews_data;
    return_data["charts"] = stockCharts_data;
    return_data["insights"] = stockInsights_data;
    return_data["insightsTrends"] = stockInsightsTrendsCharts_data;
    return_data["insightsEPS"] = stockInsightsEPSCharts_data;

    return res.json(return_data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({});
  }
});

app.get('/stock/update', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    let return_data = await getStockDetailAndSummary(symbol);
    // const testT = new Date(Number(return_data.detail.timestamp));
    // console.log("timestamp: ", testT.toISOString());
    if (Object.keys(return_data).length === 0) {
      return res.json({});
    }
    const summaryCharts = await getStockSummaryCharts(symbol, return_data.detail.timestamp);
    return_data["summaryCharts"] = summaryCharts;
    return res.json(return_data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({});
  }
});

// watchlist和portfolio的操作

async function getStockName(stock) {
  const target_url = `https://finnhub.io/api/v1/stock/profile2?symbol=${stock}&token=${api_key_finnhub}`;
  const response = await fetch(target_url);
  const data = await response.json();
  return data["name"];
}

async function getFinancialPrice(stock) {
  const target_url = `https://finnhub.io/api/v1/quote?symbol=${stock}&token=${api_key_finnhub}`;
  const response = await fetch(target_url);
  const data = await response.json();
  return {
    "currentPrice": data["c"].toFixed(2),
    "change": data["d"].toFixed(2),
    "changePercent": data["dp"] ? data["dp"].toFixed(2) : "0.00"
  };
}

async function getPortfolio() {
  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    if (profile) {
      const wallet = profile.wallet.toFixed(2);
      const portfolioData = await Promise.all(profile.portfolio.map(async (item) => {
        const priceData = await getFinancialPrice(item.stock);
        const avgCost = item.totalCost / item.quantity;
        return {
          "stock": item.stock,
          "name": item.name,
          "quantity": item.quantity.toFixed(2),
          "totalCost": item.totalCost.toFixed(2),
          "avgCost": avgCost.toFixed(2),
          "currentPrice": priceData.currentPrice,
          "change": (Number(priceData.currentPrice) - Number(avgCost.toFixed(2))).toFixed(2),
          "marketValue": (Number(priceData.currentPrice) * item.quantity).toFixed(2),
        };
      }));
      return { "wallet": wallet, "portfolio": portfolioData };
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error:', error);
    return {};
  }
}

app.get('/financial/init', async (req, res) => {
  try {
    await UserFinancialProfile.deleteMany({});

    const newUserFinancialProfile = new UserFinancialProfile({
      id: 0,
      wallet: 25000,
      watchList: [],
      portfolio: [],
    });

    await newUserFinancialProfile.save();

    res.send({ "success": true });
  } catch (error) {
    console.error('Error initializing user financial profile:', error);
    res.status(500).send({});
  }
});

app.get('/financial/getWallet', async (req, res) => {
  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    if (profile) {
      res.json({ "wallet": profile.wallet.toFixed(2) });
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({});
  }
});

app.get('/financial/getWatchList', async (req, res) => {
  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    if (profile) {
      const watchListData = await Promise.all(profile.watchList.map(async (item) => {
        const priceData = await getFinancialPrice(item.stock);
        return {
          "stock": item.stock,
          "name": item.name,
          "currentPrice": priceData.currentPrice,
          "change": priceData.change,
          "changePercent": priceData.changePercent
        };
      }));
      res.json({ "watchList": watchListData });
    } else {
      res.status(404).send({});
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({});
  }
});

app.get('/financial/getPortfolio', async (req, res) => {
  const portfolio_data = await getPortfolio();
  res.json(portfolio_data);
});

app.get('/financial/getInfo', async (req, res) => {
  if (!req.query.symbol) { return res.json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { res.json({}); }

  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    const watchListExists = profile.watchList.some(item => item.stock === symbol);
    const portfolioExists = profile.portfolio.some(item => item.stock === symbol);
    res.json({ "watchList": watchListExists, "portfolio": portfolioExists });
  } catch (error) {
    console.error('Error:', error);
    res.json({});
  }
});

app.get('/financial/getPrice', async (req, res) => {
  if (!req.query.symbol) { return res.json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { res.json({}); }

  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    const portfolioItem = profile.portfolio.find(item => item.stock === symbol);
    const quantity = portfolioItem ? portfolioItem.quantity : 0;
    const price = await getFinancialPrice(symbol);
    res.json({ "wallet": profile.wallet.toFixed(2), "currentPrice": price.currentPrice, "quantity": quantity });
  } catch (error) {
    res.json({});
  }
});

app.get('/financial/addWatchList', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    const profile = await UserFinancialProfile.findOne({ id: 0 });
    const watchListExists = profile.watchList.some(item => item.stock === symbol);
    if (watchListExists) { return res.json({}); }
    const stock_name = await getStockName(symbol);
    const result = await UserFinancialProfile.updateOne({ id: 0 }, {
      $push: { watchList: { stock: symbol, name: stock_name } }
    });
    if (result.modifiedCount > 0) {
      res.json({ "success": true });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error:', error);
    res.json({});
  }
});

app.get('/financial/removeWatchList', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    const result = await UserFinancialProfile.updateOne({ id: 0 }, {
      $pull: { watchList: { stock: symbol } }
    });
    if (result.modifiedCount > 0) {
      res.json({ "success": true });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error:', error);
    res.json({});
  }
});

app.get('/financial/buy', async (req, res) => {
  if (!req.query.symbol || !req.query.quantity) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }
  const quantity = Number(req.query.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) { return res.status(400).json({}); }

  const profile = await UserFinancialProfile.findOne({ id: 0 });
  if (profile) {
    const wallet = profile.wallet;
    const priceData = await getFinancialPrice(symbol);
    const cost = priceData.currentPrice * quantity;
    if (wallet >= cost) {
      if (profile.wallet >= cost) {
        const portfolioItem = profile.portfolio.find(item => item.stock === symbol);
        if (portfolioItem) {
          portfolioItem.quantity += quantity;
          portfolioItem.totalCost += cost;
        } else {
          const stockName = await getStockName(symbol);
          profile.portfolio.push({
            stock: symbol,
            name: stockName,
            quantity: quantity,
            totalCost: cost
          });
        }
        profile.wallet -= cost;
        await profile.save();
        const portfolio_data = await getPortfolio()
        portfolio_data["success"] = true;
        res.json(portfolio_data);
        return;
      }
    } else {
      const portfolio_data = await getPortfolio();
      portfolio_data["success"] = false;
      res.json(portfolio_data);
      return;
    }
  }
  res.status(500).send({});
});

app.get('/financial/sell', async (req, res) => {
  if (!req.query.symbol || !req.query.quantity) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }
  const quantity = Number(req.query.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) { return res.status(400).json({}); }

  const profile = await UserFinancialProfile.findOne({ id: 0 });
  if (profile) {
    const portfolioItem = profile.portfolio.find(item => item.stock === symbol);
    if (!portfolioItem || portfolioItem.quantity < quantity) {
      const portfolio_data = await getPortfolio();
      portfolio_data["success"] = false;
      res.json(portfolio_data);
      return;
    }
    const priceData = await getFinancialPrice(symbol);
    const cost = priceData.currentPrice * quantity;
    portfolioItem.quantity -= quantity;
    if (portfolioItem.quantity === 0) {
      profile.portfolio = profile.portfolio.filter(item => item.stock !== symbol);
    } else {
      portfolioItem.totalCost -= cost;
    }
    profile.wallet += cost;
    await profile.save();

    const portfolio_data = await getPortfolio();
    portfolio_data["success"] = true;
    res.json(portfolio_data);
    return;
  }
  const portfolio_data = await getPortfolio();
  portfolio_data["success"] = false;
  res.json(portfolio_data);
  return;
});

app.use(express.static(__dirname + '/dist/web/browser'));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname + '/dist/web/browser/index.html'));
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;