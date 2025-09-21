import { Component, OnInit } from '@angular/core';
import { UsersService, AdminUserRow } from '../../shared/services/users.service';

@Component({
  selector: 'app-users-admin',
  templateUrl: './users-admin.component.html',
  styleUrls: ['./users-admin.component.scss']
})
export class UsersAdminComponent implements OnInit {
  users: AdminUserRow[] = [];
  newUser: Partial<AdminUserRow> = { name: '', email: '', password: '', phone: '', role: 'member' } as any;
  addPanelOpen = false;

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.usersService.all().subscribe(list => {
      this.users = list;
    });
  }

  toggleAddPanel() { this.addPanelOpen = !this.addPanelOpen; }

  addUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.role) return;
    const password = this.newUser.password || 'defaultpass123';
    this.usersService.add({ 
      name: this.newUser.name!, 
      email: this.newUser.email!, 
      password: password, 
      phone: this.newUser.phone || '', 
      role: (this.newUser.role as 'admin' | 'member') || 'member' 
    });
    this.newUser = { name: '', email: '', password: '', phone: '', role: 'member' } as any;
    this.addPanelOpen = false; // close on save
  }

  cancelAdd() {
    this.newUser = { name: '', email: '', password: '', phone: '', role: 'member' } as any;
    this.addPanelOpen = false;
  }

  deleteUser(id: number) {
    this.usersService.remove(id);
  }
}
