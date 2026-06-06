import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { NavigationItem } from '../../models/navigation-item.model';

@Component({
  selector: 'app-bottom-navigation',
  templateUrl: './bottom-navigation.component.html',
  styleUrls: ['./bottom-navigation.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavigationComponent {
  private readonly router = inject(Router);

  readonly navigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Categorias', icon: 'pricetags-outline', route: '/categorias' },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
    { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes' },
    { label: 'Configuracion', icon: 'settings-outline', route: '/configuracion' },
  ];

  isActive(item: NavigationItem): boolean {
    const route = item.route;

    if (!route) {
      return false;
    }

    if (route === '/configuracion') {
      return (
        this.router.url.startsWith('/configuracion') ||
        this.router.url.startsWith('/perfil')
      );
    }

    return this.router.url.startsWith(route);
  }

  navigate(item: NavigationItem, event: Event): void {
    this.releaseFocus(event);

    if (item.route) {
      window.requestAnimationFrame(() => {
        this.releaseFocus();
        void this.router.navigateByUrl(item.route as string);
      });
    }
  }

  releaseFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
