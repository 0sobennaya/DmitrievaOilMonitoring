import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PumpCard } from "./pump-card/pump-card";
import { Sidenav } from './sidenav/sidenav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PumpCard, Sidenav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DmitrievaClient');
}
