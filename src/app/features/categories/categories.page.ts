import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';

import { NavigationItem } from '../../shared/models/navigation-item.model';
import {
  CategoriesApiResult,
  CategoriesApiService,
} from './services/categories-api.service';
import {
  CategoryApiRecord,
  CategoryFilter,
  CategoryFilterId,
  CategoryMovementType,
  CategoryPayload,
} from './models/category.models';

interface CategoryViewModel {
  idCategoria: number;
  nombre: string;
  tipoMovimiento: CategoryMovementType;
  activo: boolean;
  fechaCreacion?: string;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage implements OnInit, OnDestroy {
  private readonly categoriesApiService = inject(CategoriesApiService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly filters: CategoryFilter[] = [
    { id: 'all', label: 'Todas' },
    { id: 'Ingreso', label: 'Ingresos' },
    { id: 'Gasto', label: 'Gastos' },
  ];

  readonly bottomNavigation: NavigationItem[] = [
    { label: 'Inicio', icon: 'home-outline', route: '/home' },
    { label: 'Movimientos', icon: 'swap-horizontal-outline', route: '/movimientos' },
    { label: 'Categor\u00edas', icon: 'pricetags-outline', route: '/categorias', active: true },
    { label: 'Billeteras', icon: 'wallet-outline', route: '/billeteras' },
    { label: 'Reportes', icon: 'bar-chart-outline', route: '/reportes' },
    { label: 'Configuracion', icon: 'settings-outline', route: '/configuracion' },
  ];

  readonly form = this.formBuilder.group({
    nombre: ['', Validators.required],
    tipoMovimiento: ['', Validators.required],
  });

  categories: CategoryViewModel[] = [];
  filteredCategories: CategoryViewModel[] = [];
  selectedFilter: CategoryFilterId = 'all';
  editingCategory?: CategoryViewModel;
  mobileCreateMode = false;
  isLoadingCategories = false;
  isSavingCategory = false;
  categoryError = '';
  formError = '';
  formSuccess = '';

  private readonly stateChanges = new Set<number>();

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get formTitle(): string {
    return this.editingCategory ? 'Editar categoria' : 'Nueva categoria';
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryError = '';
    this.changeDetectorRef.markForCheck();

    this.categoriesApiService
      .consultar()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingCategories = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.categories = this.toCategories(response);
          this.applyFilter();
        },
        error: () => {
          this.categories = [];
          this.filteredCategories = [];
          this.categoryError = 'No se pudieron cargar las categorias.';
        },
      });
  }

  setFilter(filter: CategoryFilterId): void {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  editCategory(category: CategoryViewModel): void {
    this.editingCategory = category;
    this.mobileCreateMode = true;
    this.formError = '';
    this.formSuccess = '';
    this.form.setValue({
      nombre: category.nombre,
      tipoMovimiento: category.tipoMovimiento,
    });
    this.scrollToTop();
  }

  openMobileCreate(): void {
    this.editingCategory = undefined;
    this.mobileCreateMode = true;
    this.formError = '';
    this.formSuccess = '';
    this.form.reset({
      nombre: '',
      tipoMovimiento: '',
    });
    this.scrollToTop();
  }

  cancelEdit(): void {
    this.editingCategory = undefined;
    this.mobileCreateMode = false;
    this.formError = '';
    this.formSuccess = '';
    this.form.reset({
      nombre: '',
      tipoMovimiento: '',
    });
  }

  saveCategory(): void {
    if (this.form.invalid || this.isSavingCategory) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();

    if (!payload) {
      return;
    }

    this.isSavingCategory = true;
    this.formError = '';
    this.formSuccess = '';
    this.changeDetectorRef.markForCheck();

    const request = this.editingCategory
      ? this.categoriesApiService.actualizar(
          this.editingCategory.idCategoria,
          payload,
        )
      : this.categoriesApiService.crear(payload);

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSavingCategory = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const successMessage = this.editingCategory
            ? 'Categoria actualizada correctamente.'
            : 'Categoria creada correctamente.';
          this.cancelEdit();
          this.formSuccess = successMessage;
          this.loadCategories();
        },
        error: () => {
          this.formError = 'No se pudo guardar la categoria.';
        },
      });
  }

  changeCategoryState(category: CategoryViewModel): void {
    if (this.stateChanges.has(category.idCategoria)) {
      return;
    }

    const nextState = !category.activo;
    this.stateChanges.add(category.idCategoria);
    this.categoryError = '';
    this.changeDetectorRef.markForCheck();

    this.categoriesApiService
      .cambiarEstado(category.idCategoria, nextState)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.stateChanges.delete(category.idCategoria);
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          if (this.editingCategory?.idCategoria === category.idCategoria) {
            this.cancelEdit();
          }

          this.loadCategories();
        },
        error: () => {
          this.categoryError = 'No se pudo cambiar el estado de la categoria.';
        },
      });
  }

  isChangingState(category: CategoryViewModel): boolean {
    return this.stateChanges.has(category.idCategoria);
  }

  trackByCategory(_: number, category: CategoryViewModel): number {
    return category.idCategoria;
  }

  navigateFromBottomNavigation(item: NavigationItem, event: Event): void {
    this.releaseNavigationFocus(event);

    if (item.route) {
      window.requestAnimationFrame(() => {
        this.releaseNavigationFocus();
        void this.router.navigateByUrl(item.route as string);
      });
    }
  }

  releaseNavigationFocus(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  private scrollToTop(): void {
    window.requestAnimationFrame(() => {
      const content = document.querySelector('ion-content') as
        | (HTMLElement & { scrollToTop?: (duration?: number) => Promise<void> })
        | null;

      if (content?.scrollToTop) {
        void content.scrollToTop(180);
        return;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private toPayload(): CategoryPayload | null {
    const value = this.form.getRawValue();
    const nombre = value.nombre.trim();
    const tipoMovimiento = value.tipoMovimiento.trim();

    if (!nombre) {
      this.form.controls.nombre.setErrors({ required: true });
      this.form.markAllAsTouched();
      return null;
    }

    if (!this.isCategoryMovementType(tipoMovimiento)) {
      this.form.controls.tipoMovimiento.setErrors({ required: true });
      this.form.markAllAsTouched();
      return null;
    }

    return {
      nombre,
      tipoMovimiento,
    };
  }

  private applyFilter(): void {
    const categories =
      this.selectedFilter === 'all'
        ? this.categories
        : this.categories.filter(
            (category) => category.tipoMovimiento === this.selectedFilter,
          );

    this.filteredCategories = [...categories];

    this.changeDetectorRef.markForCheck();
  }

  private toCategories(response: CategoriesApiResult): CategoryViewModel[] {
    return this.extractRecords(response)
      .map((record) => this.toCategory(record))
      .filter(
        (category): category is CategoryViewModel => category !== null,
      );
  }

  private extractRecords(response: CategoriesApiResult): CategoryApiRecord[] {
    return Array.isArray(response)
      ? response
      : Array.isArray(response.data)
        ? response.data
        : [];
  }

  private toCategory(record: CategoryApiRecord): CategoryViewModel | null {
    const idCategoria = this.getNumber(record, ['IdCategoria', 'idCategoria', 'id']);
    const nombre = this.getText(record, ['Nombre', 'nombre']);
    const tipoMovimiento = this.toCategoryMovementType(
      this.getText(record, ['TipoMovimiento', 'tipoMovimiento']),
    );

    if (idCategoria === undefined || !nombre || !tipoMovimiento) {
      return null;
    }

    return {
      idCategoria,
      nombre,
      tipoMovimiento,
      activo:
        this.toBoolean(this.getValue(record, ['Activo', 'activo'])) ?? true,
      fechaCreacion: this.formatDate(
        this.getText(record, ['FechaCreacion', 'fechaCreacion']),
      ),
    };
  }

  private getText(
    record: CategoryApiRecord,
    keys: string[],
  ): string | undefined {
    const value = this.getValue(record, keys);

    if (value === undefined || value === null) {
      return undefined;
    }

    const text = String(value).trim();

    return text.length > 0 ? text : undefined;
  }

  private getNumber(
    record: CategoryApiRecord,
    keys: string[],
  ): number | undefined {
    const value = this.getValue(record, keys);

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);

      return Number.isFinite(parsedValue) ? parsedValue : undefined;
    }

    return undefined;
  }

  private getValue(record: CategoryApiRecord, keys: string[]): unknown {
    return keys.map((key) => record[key]).find((value) => value !== undefined);
  }

  private toBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();

      if (['true', '1', 'activo'].includes(normalizedValue)) {
        return true;
      }

      if (['false', '0', 'inactivo'].includes(normalizedValue)) {
        return false;
      }
    }

    return undefined;
  }

  private toCategoryMovementType(
    value: string | undefined,
  ): CategoryMovementType | undefined {
    const normalizedValue = (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalizedValue.includes('ingreso')) {
      return 'Ingreso';
    }

    if (normalizedValue.includes('gasto')) {
      return 'Gasto';
    }

    return undefined;
  }

  private isCategoryMovementType(
    value: string,
  ): value is CategoryMovementType {
    return value === 'Ingreso' || value === 'Gasto';
  }

  private formatDate(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
