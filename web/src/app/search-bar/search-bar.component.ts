import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent {
  searchForm = new FormGroup({
    stockInput: new FormControl('', Validators.required)
  })

  constructor(
    private router: Router,
  ) { }

  searchStock(event: Event) {
    event.preventDefault();
    if (this.searchForm.valid) {
      // 执行搜索股票的逻辑
      const stock = this.searchForm.get('stockInput')?.value;
      this.router.navigate(['/search/'+stock]);
    }
  }

  clearSearch() {
    this.searchForm.reset();
    this.router.navigate(['/search/home']);
  }
}
