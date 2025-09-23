import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-order-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './order-details-dialog.component.html',
  styleUrl: './order-details-dialog.component.scss'
})
export class OrderDetailsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { order: any },
    private ref: MatDialogRef<OrderDetailsDialogComponent>,
  ) {}

  get total(): number {
    const o = this.data.order;
    if (!o) return 0;
    if (typeof o.total === 'number') return o.total;
    const sum = (o.items || []).reduce((s: number, it: any) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
    return sum;
  }

  close() { this.ref.close(); }
}
