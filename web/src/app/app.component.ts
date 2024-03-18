import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { StockService } from './stock.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgbModule],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  isNavbarCollapsed = true;
  currentStock?: string;

  constructor(
    private router: Router,
    private stockService: StockService
  ) { }

  ngOnInit() {
    this.stockService.stock$.subscribe(stock => {
      this.currentStock = stock;
    });
  }

  // 返回搜索主页，判断是否要回到上次搜索的结果界面
  gotoSearchView() {
    if (this.currentStock) {
      this.router.navigate(['/search', this.currentStock]);
    } else {
      this.router.navigate(['/search/home']);
    }
  }

  // 判断是否是当前页面（用于navbar给当前界面的按钮突出显示）
  isLinkActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
