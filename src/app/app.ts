import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MainNavigationComponent } from './components/ui/main-navigation/main-navigation.component';
import { FooterComponent } from './components/ui/footer/footer.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatIconModule,
    MainNavigationComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'BracketAce';
  private currentUrl = '';

  constructor(private router: Router) {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  protected isPublicRoute(): boolean {
    // List of routes that should not show navigation/footer
    const publicRoutes = [
      '/schedule/',
      '/live/',
      '/players/',
      '/standings/',
      '/teams/',
      '/rules/'
    ];

    return publicRoutes.some(route => this.currentUrl.includes(route));
  }
}
