import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { OrderDetailsDialogComponent } from './order-details-dialog.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatTableModule, 
    MatCardModule, 
    MatButtonModule, 
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  orders$!: Observable<any[]>;
  filteredOrders$!: Observable<any[]>;
  
  searchControl = new FormControl<string>('', { nonNullable: true });
  statusControl = new FormControl<string>('all', { nonNullable: true });
  
  isHandset = false;
  displayedColumns = ['id', 'name', 'email', 'contact', 'total', 'created_at', 'actions'];

  constructor(
    private http: HttpClient, 
    private auth: AuthService, 
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    this.orders$ = this.http.get<any[]>('/.netlify/functions/orders-direct', { headers });
    
    // Set up filtering
    this.filteredOrders$ = combineLatest([
      this.orders$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.statusControl.valueChanges.pipe(startWith('all'))
    ]).pipe(
      map(([orders, searchTerm, status]) => {
        return orders.filter(order => {
          const matchesSearch = !searchTerm || 
            order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm);
          
          const matchesStatus = status === 'all' || 
            this.getOrderStatus(order).toLowerCase() === status.toLowerCase();
          
          return matchesSearch && matchesStatus;
        });
      })
    );
    
    // Check for mobile/tablet
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => {
        this.isHandset = result.matches;
      });
  }

  view(order: any) {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '720px',
      data: { order },
    });
  }

  trackByOrderId(index: number, order: any): number {
    return order.id;
  }

  getItemsCount(order: any): number {
    return order.items?.length || 2; // Default for demo
  }

  getOrderStatus(order: any): string {
    // Simple status logic - you can enhance this based on your data structure
    const statuses = ['Processing', 'Shipped', 'Delivered', 'Pending'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  getStatusIcon(order: any): string {
    const status = this.getOrderStatus(order).toLowerCase();
    switch (status) {
      case 'processing': return 'hourglass_empty';
      case 'shipped': return 'local_shipping';
      case 'delivered': return 'check_circle';
      case 'pending': return 'schedule';
      default: return 'help';
    }
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchInput?.nativeElement.focus();
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('all');
  }
}
