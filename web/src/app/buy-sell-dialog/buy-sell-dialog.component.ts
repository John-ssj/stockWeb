import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-buy-sell-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './buy-sell-dialog.component.html',
  styleUrls: ['./buy-sell-dialog.component.css']
})
export class BuySellDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<BuySellDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public stockData: any
  ) { }

  buySellQuantity = new FormControl(0);

  ngOnInit() {

  }

  returnQuantity() {
    this.dialogRef.close(this.buySellQuantity.value ? this.buySellQuantity.value : 0);
  }
}
