import { Component, inject, ViewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { DOCUMENT, CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly bo = inject(BreakpointObserver);
  @ViewChild('sidenav') sidenav?: MatSidenav;

  dark = false;
  isHandset = false;

  constructor(public auth: AuthService, public cart: CartService) {
    // Update handset flag on breakpoint changes
    this.bo.observe([Breakpoints.Handset]).subscribe(r => this.isHandset = r.matches);
  }

  toggleTheme(): void {
    this.dark = !this.dark;
    const body = this.document.body;
    if (this.dark) {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    }
  }

  isLoggedIn(): boolean { return this.auth.isLoggedIn(); }
  isAdmin(): boolean { return this.auth.isAdmin(); }
  logout() { this.auth.logout(); }
  get cartCount(): number {
    try { return (this.cart as any).itemsSubject.value.reduce((s: number, i: any) => s + (Number(i.qty)||0), 0); } catch { return 0; }
  }

  closeIfHandset() {
    if (this.isHandset) {
      this.sidenav?.close();
    }
  }
}
