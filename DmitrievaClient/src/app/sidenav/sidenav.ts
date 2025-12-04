import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatSidenavModule, MatListModule, MatToolbarModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.html',
  styleUrls: ['./sidenav.css']
})
export class Sidenav {}
