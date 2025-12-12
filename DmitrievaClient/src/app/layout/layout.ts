import { Component } from '@angular/core';
import { Sidenav } from "../pages/sidenav/sidenav";
import { MatSidenavModule } from "@angular/material/sidenav";
import { Header} from "../pages/header/header";
@Component({
  selector: 'app-layout',
  imports: [Sidenav, MatSidenavModule, Header],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {

}
