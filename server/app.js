const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 8080;

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
    console.log(data);
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

const getStockNews = async (stock) => {
  t = new Date();
  const time_to = t.toISOString().split('T')[0];
  t.setDate(t.getDate() - 7);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://finnhub.io/api/v1/company-news?symbol=${stock}&from=${time_from}&to=${time_to}&token=${api_key_finnhub}`;
  try {
    const response = await fetch(target_url);
    const data = await response.json();
    if (Object.keys(data).length === 0) {
      return [];
    } else {
      filtered_data = data.filter(item =>
        item.headline && item.image && item.source && item.datetime && item.summary && item.url
      );
      selected_data = filtered_data.length <= 20 ? filtered_data : filtered_data.slice(0, 20);
      extracted_data = selected_data.map(item => {
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

const getStockCharts = async (stock) => {
  t = new Date();
  const time_to = t.toISOString().split('T')[0];
  t.setFullYear(t.getFullYear() - 2);
  const time_from = t.toISOString().split('T')[0];
  const target_url = `https://api.polygon.io/v2/aggs/ticker/${stock}/range/1/day/${time_from}/${time_to}?adjusted=true&sort=asc&apiKey=${api_key_polygon}`;
  data = {};
  try {
    const response = await fetch(target_url);
    data = await response.json();
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
    console.log(data);
    return {};
  }
};

const getStockInsights = async (stock) => {
  const target_url = `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${stock}&from=2022-01-01&token=${api_key_finnhub}`;
  filtered_data = {};
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

      extracted_data = {
        "totalMspr": Number(totalMspr.toFixed(2)),
        "positiveMspr": Number(positiveMspr.toFixed(2)),
        "negativeMspr": Number(negativeMspr.toFixed(2)),
        "totalChange": Number(totalChange.toFixed(2)),
        "positiveChange": Number(positiveChange.toFixed(2)),
        "negativeChange": Number(negativeChange.toFixed(2))
      }
      return extracted_data;
    }
  } catch (error) {
    console.error('Error:', error);
    console.log(filtered_data);
    return {};
  }
};

app.get('/stock/company', async (req, res) => {
  if (!req.query.symbol) { return res.status(400).json({}); }
  const symbolMatches = req.query.symbol.match(/[a-zA-Z]+/g);
  const symbol = symbolMatches ? symbolMatches.join('').toUpperCase() : '';
  if (!symbol) { return res.status(400).json({}); }

  try {
    return_data = await getStockDetailAndSummary(symbol);
    if (Object.keys(return_data).length === 0) {
      return res.json({});
    }
    stockNews_data = await getStockNews(symbol);
    stockCharts_data = await getStockCharts(symbol);
    stockInsights_data = await getStockInsights(symbol);
    return_data["news"] = stockNews_data;
    return_data["charts"] = stockCharts_data;
    return_data["insights"] = stockInsights_data;
    return res.json(return_data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({});
  }
});

app.use(express.static(__dirname + '/dist/web/browser'));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname + '/dist/web/browser/index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
