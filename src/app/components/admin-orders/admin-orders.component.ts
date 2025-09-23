import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { OrderDetailsDialogComponent } from './order-details-dialog.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatDialogModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent {
  orders$!: Observable<any[]>;
  displayedColumns = ['id', 'name', 'email', 'contact', 'total', 'created_at', 'actions'];

  constructor(private http: HttpClient, private auth: AuthService, private dialog: MatDialog) {}

  ngOnInit() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.orders$ = this.http.get<any[]>('/.netlify/functions/orders-direct', { headers });
  }

  view(order: any) {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '720px',
      data: { order },
    });
  }
}
