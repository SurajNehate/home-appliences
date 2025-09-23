import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatCardModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  sections = [
    { value: 'products', label: 'Products' },
    { value: 'orders', label: 'Orders' },
    { value: 'users', label: 'Users' },
  ];
  selected = 'products';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const child = this.route.firstChild?.snapshot.url[0]?.path || 'products';
    if (this.sections.find(s => s.value === child)) {
      this.selected = child;
    }
  }

  onChange(value: string) {
    this.router.navigate(['./' + value], { relativeTo: this.route });
  }
}
