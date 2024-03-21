import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import indicators from 'highcharts/indicators/indicators';
import volumeByPrice from 'highcharts/indicators/volume-by-price';
import { MatDialog } from '@angular/material/dialog';

indicators(Highcharts);
volumeByPrice(Highcharts);

import { StockService } from '../stock.service';
import { ServerService } from '../server.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { NewsDetailDialogComponent } from '../news-detail-dialog/news-detail-dialog.component'; // 引入对话框组件
@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatProgressSpinnerModule, MatTabsModule, HighchartsChartModule, SearchBarComponent],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.css']
})
export class StockDetailComponent {
  stock!: string;

  showLoading = false;
  showDetailView = false;
  showErrorView = false;
  stockData: any = {};
  detailDate: Date = new Date();

  collectBtn = false;
  sellBtn = false;


  // Highcharts
  summaryCharts: typeof Highcharts = Highcharts;
  summaryChartsOptions: Highcharts.Options = {};

  mainCharts: typeof Highcharts = Highcharts;
  mainChartsOptions: Highcharts.Options = {};

  insightsTrendsCharts: typeof Highcharts = Highcharts;
  insightsTrendsChartsOptions: Highcharts.Options = {};

  insightsEPSCharts: typeof Highcharts = Highcharts;
  insightsEPSChartsOptions: Highcharts.Options = {};

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public dialog: MatDialog,
    private stockService: StockService,
    private serverService: ServerService
  ) { }

  ngOnInit() {
    // this.stock = this.route.snapshot.paramMap.get('stock')!;
    this.route.params.subscribe(params => {
      this.stock = params['stock'].toUpperCase();
      this.loadData();
    });
  }

  loadData() {
    this.showLoading = true;
    this.showDetailView = false;
    this.showErrorView = false;

    if (this.stock === this.stockService.getStock() && this.stockService.getStockData() !== "") {
      // loard Data from serverService
      if (this.stockService.getStockData() === "no") {
        this.fn_showErrorView();
        return;
      }
      this.stockData = this.stockService.getStockData();
      this.fn_showDetailView();
      return;
    } else {
      // get Data from api
      this.stockService.updateStock(this.stock);
      this.stockService.updateStockData("");
      try {
        const url = this.serverService.getServerUrl() + '/stock/company?symbol=' + this.stock;
        this.http.get<any>(url).subscribe({
          next: (result) => {
            console.log('Stock data:', result);
            this.stockData = result;
            if (Object.keys(this.stockData).length === 0) {
              this.stockService.updateStockData("no");
              this.fn_showErrorView();
              return;
            }
            this.stockService.updateStockData(this.stockData);
            this.fn_showDetailView();
          },
          error: (error) => {
            console.error('Error fetching stock data:', error);
            this.fn_showErrorView();
          }
        });
      } catch (error) {
        this.fn_showErrorView();
      }
    }
  }

  setUpViewData() {
    if (this.stockData.detail.status) {
      this.detailDate = this.stockData.detail.timestamp;
    } else {
      this.detailDate = new Date();
    }
    this.updateSummaryCharts();
    this.updateMainCharts();
    this.updateInsightsTrendsCharts();
    this.updateInsightsEPSCharts();
  }

  fn_showDetailView() {
    this.showLoading = false;
    this.showDetailView = true;
    this.showErrorView = false;
    this.setUpViewData();
  }

  fn_showErrorView() {
    this.showLoading = false;
    this.showDetailView = false;
    this.showErrorView = true;
  }

  showNewsDetail(index: number) {
    const dialogRef = this.dialog.open(NewsDetailDialogComponent, {
      width: '580px',
      position: {
        top: '30px',
      },
      data: this.stockData.news[index]
    });
    // dialogRef.afterClosed().subscribe(result => {
    //   console.log('The dialog was closed');
    // });
  }

  updateSummaryCharts() {
    this.summaryChartsOptions = {
      chart: {
        backgroundColor: '#f8f8f8'
      },

      rangeSelector: {
        enabled: false
      },

      title: {
        text: this.stock + ' Hourly Price Variation'
      },

      navigator: {
        enabled: false
      },

      series: [{
        name: 'AAPL',
        data: this.stockData.summaryCharts,
        tooltip: {
          valueDecimals: 2
        }
      }] as Highcharts.SeriesSplineOptions[]
    };
  }

  updateMainCharts() {
    this.mainChartsOptions = {
      chart: {
        backgroundColor: '#f8f8f8'
      },

      rangeSelector: {
        selected: 2
      },

      title: {
        text: this.stock + ' Historical'
      },

      subtitle: {
        text: 'With SMA and Volume by Price technical indicators'
      },

      yAxis: [{
        startOnTick: false,
        endOnTick: false,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'OHLC'
        },
        height: '60%',
        lineWidth: 2,
        resize: {
          enabled: true
        }
      }, {
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Volume'
        },
        top: '65%',
        height: '35%',
        offset: 0,
        lineWidth: 2
      }],

      tooltip: {
        split: true
      },

      plotOptions: {
        series: {
          dataGrouping: {
            units: [[
              'week',
              [1]
            ], [
              'month',
              [1, 2, 3, 4, 6]
            ]]
          }
        }
      },

      series: [{
        type: 'candlestick',
        name: this.stock,
        id: this.stock.toLowerCase(),
        zIndex: 2,
        data: this.stockData.charts.ohlc
      }, {
        type: 'column',
        name: 'Volume',
        id: 'volume',
        data: this.stockData.charts.volume,
        yAxis: 1
      }, {
        type: 'vbp',
        linkedTo: this.stock.toLowerCase(),
        params: {
          volumeSeriesID: 'volume'
        },
        dataLabels: {
          enabled: false
        },
        zoneLines: {
          enabled: false
        }
      }, {
        type: 'sma',
        linkedTo: this.stock.toLowerCase(),
        zIndex: 1,
        marker: {
          enabled: false
        }
      }] as Highcharts.SeriesOptionsType[]
    };
  }

  updateInsightsTrendsCharts() {
    this.insightsTrendsChartsOptions = {
      chart: {
        type: 'column',
        backgroundColor: '#f8f8f8'
      },

      title: {
        text: 'Recommendation Trends'
      },

      xAxis: {
        categories: this.stockData.insightsTrends.period,
      },

      yAxis: {
        min: 0,
        title: {
          text: '#Analysis'
        },
        stackLabels: {
          enabled: true
        }
      },

      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true
          }
        }
      },

      series: [{
        name: 'Strong Buy',
        data: this.stockData.insightsTrends.strongBuy,
        color: '#207a3f'
      }, {
        name: 'Buy',
        data: this.stockData.insightsTrends.buy,
        color: '#37bf5f'
      }, {
        name: 'Hold',
        data: this.stockData.insightsTrends.hold,
        color: '#c2951f'
      }, {
        name: 'Sell',
        data: this.stockData.insightsTrends.sell,
        color: '#f66768'
      }, {
        name: 'Strong Sell',
        data: this.stockData.insightsTrends.strongSell,
        color: '#8d3838'
      }] as Highcharts.SeriesColumnOptions[]
    };
  }

  updateInsightsEPSCharts() {
    this.insightsEPSChartsOptions = {
      chart: {
        type: 'spline',
        backgroundColor: '#f8f8f8'
      },

      title: {
        text: 'Historical EPS Surprises'
      },

      xAxis: {
        categories: this.stockData.insightsEPS.periodAndSurprise,
      },

      yAxis: {
        title: {
          text: 'Quarterly EPS'
        }
      },

      series: [{
        name: 'Actual',
        marker: {
            symbol: 'circle'
        },
        data: this.stockData.insightsEPS.actual
    }, {
        name: 'Estimate',
        marker: {
            symbol: 'diamond'
        },
        data: this.stockData.insightsEPS.estimate
    }] as Highcharts.SeriesSplineOptions[]
    };
  }
}
