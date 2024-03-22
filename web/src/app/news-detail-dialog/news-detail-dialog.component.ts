import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-news-detail-dialog',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './news-detail-dialog.component.html',
  styleUrls: ['./news-detail-dialog.component.css']
})
export class NewsDetailDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public news: any) { }
  twitterShareUrl: string = "";
  facebookShareUrl: string = "";

  ngOnInit(): void {
    this.twitterShareUrl = this.generateTwitterShareLink(this.news.headline, this.news.url);
    this.facebookShareUrl = this.generateFacebookShareLink(this.news.url);
  }

  generateTwitterShareLink(text: string, url: string): string {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }

  generateFacebookShareLink(url: string): string {
    const encodedUrl = encodeURIComponent(url);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&amp;src=sdkpreparse`;
  }
}
