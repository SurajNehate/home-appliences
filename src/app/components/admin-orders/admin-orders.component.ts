import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent {
  orders$!: Observable<any[]>;
  displayedColumns = ['id', 'name', 'email', 'contact', 'total', 'created_at', 'actions'];

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.orders$ = this.http.get<any[]>('/.netlify/functions/orders-direct', { headers });
  }

  refresh() { this.ngOnInit(); }
}
