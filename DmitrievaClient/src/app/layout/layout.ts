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
              }

  ngOnInit() {
    const isLoggedIn = this.auth.isAuth;
  }
}