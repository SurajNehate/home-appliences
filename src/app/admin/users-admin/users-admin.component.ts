import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService, AdminUserRow } from '../../shared/services/users.service';

@Component({
  selector: 'app-users-admin',
  templateUrl: './users-admin.component.html',
  styleUrls: ['./users-admin.component.scss']
})
export class UsersAdminComponent implements OnInit {
  users: AdminUserRow[] = [];
  editorText = '';
  newUser: Partial<AdminUserRow> = { name: '', email: '', password: '', phone: '', role: 'member' } as any;

  constructor(private usersService: UsersService, private router: Router) {}

  // Logout functionality moved to main header

  ngOnInit() {
    this.usersService.all().subscribe(list => {
      this.users = list;
      this.editorText = JSON.stringify(list, null, 2);
    });
  }

  onSectionChange(val: string) {
    if (val === 'products') { this.router.navigateByUrl('/admin/catalog'); }
  }

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
  }

  deleteUser(id: number) {
    this.usersService.remove(id);
  }

  downloadJson() {
    this.usersService.downloadJson('users.json');
  }

  applyEditor() {
    this.usersService.importFromJson(this.editorText);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : undefined;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = String((e.target as FileReader).result);
      this.editorText = text;
      this.applyEditor();
    };
    reader.readAsText(file);
    input.value = '';
  }
}
