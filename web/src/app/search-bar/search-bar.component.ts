import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ServerService } from '../server.service';
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, MatProgressSpinnerModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {
  @Input() initStock: string = '';

  searchForm = new FormGroup({
    stockInput: new FormControl('', Validators.required)
  })

  showErrorView = false;
  showSuggestions = false;
  showLoading = false;
  stockSuggestions: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient,
    private serverService: ServerService
  ) { }

  ngOnInit() {
    if (this.initStock !== '') {
      this.loadStock(this.initStock);
    }
    this.searchForm.get('stockInput')?.valueChanges.subscribe(value => {
      this.stockSearch(value ?? '');
    });
  }

  // stock补全提示
  stockSearch(value: string) {
    if (value !== '') {
      this.showErrorView = false;
      this.showSuggestions = true;
      this.showLoading = true;
      this.stockSuggestions = [];
      const url = this.serverService.getServerUrl() + '/stock/search?symbol=' + value;
      this.http.get<any[]>(url).subscribe({
        next: (results) => {
          this.showLoading = false;
          this.stockSuggestions = results;
        },
        error: (error) => {
          console.error('Error fetching stock data:', error);
          this.stockSuggestions = [];
        }
      });
    } else {
      this.showSuggestions = false;
      this.stockSuggestions = [];
    }
  }

  // 点击补全提示，跳转到详情界面
  jumpToStock(stock: string) {
    this.router.navigate(['/search/' + stock]);
    this.loadStock(stock);
  }

  // stock搜索按钮，点击跳转到详情界面
  searchStock(event: Event) {
    event.preventDefault();
    if (this.searchForm.valid) {
      const stock = this.searchForm.get('stockInput')?.value;
      if (stock) {
        this.router.navigate(['/search/' + stock]);
        this.loadStock(stock);
      }
    } else {
      // 输入为空，提示错误
      this.showErrorView = true;
    }
  }

  // 清空搜索框，跳转回搜索首页
  clearSearch() {
    this.searchForm.reset();
    this.showErrorView = false;
    this.showSuggestions = false;
    this.showLoading = false;
    this.stockSuggestions = [];
    this.router.navigate(['/search/home']);
  }

  // 跳转后，加载股票详情界面，隐藏补全提示，搜索框补全对应内容
  loadStock(stock: string) {
    this.searchForm.get('stockInput')?.setValue(stock);
    this.showSuggestions = false;
  }

  closeErrorView() {
    this.showErrorView = false;
  }
}
