import { Component, OnInit } from '@angular/core';
import { Sidenav } from "../pages/sidenav/sidenav";
import { MatSidenavModule } from "@angular/material/sidenav";
import { Header} from "../pages/header/header";
import { AuthService } from '../data/services/auth.service';
@Component({
  selector: 'app-layout',
  imports: [Sidenav, MatSidenavModule, Header],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  constructor(public auth: AuthService) {
    // сразу при инициализации подгружаем всё из куки
    console.log('Role:', this.auth.getRole());
    console.log('Username:', this.auth.username);
    console.log('Token exists:', !!this.auth.token);
  }

  ngOnInit() {
    // или вызови isAuth геттер
    const isLoggedIn = this.auth.isAuth;
  }
}