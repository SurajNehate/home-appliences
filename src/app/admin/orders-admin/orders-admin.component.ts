import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface OrderItem { id: number; product_id: number | null; name: string; price: number; qty: number; image_url?: string | null; }
interface OrderRow {
  id: number;
  user_id?: number | null;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-orders-admin',
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.scss']
})
export class OrdersAdminComponent implements OnInit {
  orders: OrderRow[] = [];
  expanded: Record<number, boolean> = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.http.get<OrderRow[]>('/.netlify/functions/orders-direct').subscribe(rows => {
      this.orders = rows || [];
    });
  }

  toggle(id: number) { this.expanded[id] = !this.expanded[id]; }

  delete(id: number) {
    this.http.delete('/.netlify/functions/orders-direct?id=' + id).subscribe(_ => this.reload());
  }
}
