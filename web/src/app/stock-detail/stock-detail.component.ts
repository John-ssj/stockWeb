import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';

import { StockService } from '../stock.service';
import { ServerService } from '../server.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
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


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
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
  }
}
