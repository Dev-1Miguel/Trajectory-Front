import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import type { ToggleCustomEvent } from '@ionic/angular';

import { AuthService } from '../../../core/auth/auth.service';
import { NavigationItem } from '../../models/navigation-item.model';

type ProfileMenuAction = 'profile' | 'preferences' | 'security' | 'logout';

interface ProfileMenuItem {
  label: string;
  icon: string;
  action: ProfileMenuAction;
}

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  @Input({ required: true }) navigation: NavigationItem[] = [];

  readonly profileMenuItems: ProfileMenuItem[] = [
    { label: 'Mi perfil', icon: 'person-outline', action: 'profile' },
  ];

  readonly profileMenuFooterItems: ProfileMenuItem[] = [
    { label: 'Seguridad', icon: 'shield-checkmark-outline', action: 'security' },
    { label: 'Cerrar sesion', icon: 'log-out-outline', action: 'logout' },
  ];

  profileMenuOpen = false;
  darkModeEnabled = false;
  profileName = 'Perfil';

  private readonly darkModeClass = 'ion-palette-dark';

  constructor() {
    this.darkModeEnabled = this.document.documentElement.classList.contains(
      this.darkModeClass,
    );
    this.profileName = this.obtenerNombrePerfil();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    const profileMenu = this.elementRef.nativeElement.querySelector('.profile-menu');

    if (!this.profileMenuOpen || !(target instanceof Node) || profileMenu?.contains(target)) {
      return;
    }

    this.closeProfileMenu();
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    this.closeProfileMenu();
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  selectProfileOption(action: ProfileMenuAction): void {
    this.closeProfileMenu();

    if (action === 'profile') {
      void this.router.navigateByUrl('/perfil/informacion-personal');
      return;
    }

    if (action === 'logout') {
      this.authService.logout();
      void this.router.navigateByUrl('/auth/login');
    }
  }

  toggleDarkMode(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.setDarkMode(!this.darkModeEnabled);
  }

  onDarkModeToggleClick(event: Event): void {
    event.stopPropagation();
  }

  onDarkModeToggleChange(event: Event): void {
    event.stopPropagation();
    this.setDarkMode(Boolean((event as ToggleCustomEvent).detail.checked));
  }

  private closeProfileMenu(): void {
    if (!this.profileMenuOpen) {
      return;
    }

    this.profileMenuOpen = false;
    this.changeDetectorRef.markForCheck();
  }

  private setDarkMode(isEnabled: boolean): void {
    this.darkModeEnabled = isEnabled;
    this.document.documentElement.classList.toggle(this.darkModeClass, isEnabled);
    this.changeDetectorRef.markForCheck();
  }

  private obtenerNombrePerfil(): string {
    const usuario = this.authService.obtenerUsuario();
    const nombreCompleto = usuario?.nombreCompleto?.trim();

    if (nombreCompleto) {
      return nombreCompleto.split(/\s+/)[0];
    }

    const correo = usuario?.correo?.trim();

    if (correo) {
      return correo.split('@')[0];
    }

    return 'Perfil';
  }
}
