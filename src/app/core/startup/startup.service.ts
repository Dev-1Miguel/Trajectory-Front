import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly http = inject(HttpClient);
  private readonly healthUrl = `${environment.apiUrl}/health`;
  private readonly warmupUrl = `${environment.apiUrl}/warmup`;
  private hasWarmedUp = false;
  private warmupPromise: Promise<void> | null = null;

  warmupBackend(): Promise<void> {
    if (this.hasWarmedUp) {
      return Promise.resolve();
    }

    if (this.warmupPromise) {
      return this.warmupPromise;
    }

    this.warmupPromise = this.runWarmup().finally(() => {
      this.hasWarmedUp = true;
      this.warmupPromise = null;
    });

    return this.warmupPromise;
  }

  private async runWarmup(): Promise<void> {
    await this.pingHealth();
    await this.pingWarmup();
  }

  private async pingHealth(): Promise<void> {
    try {
      await firstValueFrom(this.http.get(this.healthUrl));
    } catch (error: unknown) {
      console.warn('Trajectory startup health check failed', error);
    }
  }

  private async pingWarmup(): Promise<void> {
    try {
      await firstValueFrom(this.http.get(this.warmupUrl));
    } catch (error: unknown) {
      console.warn('Trajectory database warmup failed', error);
    }
  }
}
