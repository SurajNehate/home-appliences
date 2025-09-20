import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

function encode(data: Record<string,string>) {
  return Object.keys(data)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
    .join('&');
}

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {
  contact = environment.contact;
  form = { name: '', email: '', message: '' };
  submitted = false;
  submitting = false;

  constructor() { }

  ngOnInit() {}

  async submit() {
    this.submitting = true;
    const body = encode({ 'form-name': 'contact', ...this.form });
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      this.submitted = true;
      this.form = { name: '', email: '', message: '' };
    } catch (e) {
      alert('Failed to send message. Please try again.');
    } finally {
      this.submitting = false;
    }
  }
}
