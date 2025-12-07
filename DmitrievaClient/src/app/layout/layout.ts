import { Component } from '@angular/core';
import { Sidenav } from "../app/sidenav/sidenav";
import { MatSidenavModule } from "@angular/material/sidenav";
@Component({
  selector: 'app-layout',
  imports: [Sidenav, MatSidenavModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

}
