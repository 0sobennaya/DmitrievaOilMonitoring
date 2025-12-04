import { Component } from '@angular/core';
import { PumpCard } from "./pump-card/pump-card";

@Component({
  selector: 'app-pump-page',
  imports: [PumpCard],
  templateUrl: './pump-page.html',
  styleUrl: './pump-page.css',
})
export class PumpPage {

}
