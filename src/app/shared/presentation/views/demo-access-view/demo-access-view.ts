import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DemoSessionService } from '../../../application/demo-session.service';
import { DemoUser } from '../../../domain/model/demo-user';

@Component({
  selector: 'app-demo-access-view',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './demo-access-view.html',
  styleUrl: './demo-access-view.css',
})
export class DemoAccessView {
  private readonly demoSession = inject(DemoSessionService);
  private readonly router = inject(Router);

  readonly users = this.demoSession.users;

  selectUser(user: DemoUser): void {
    this.demoSession.selectUser(user.id);
    this.router.navigateByUrl(user.initialRoute);
  }

  roleLabel(user: DemoUser): string {
    return user.experience === 'FARMER'
      ? 'Agricultor independiente'
      : 'Director de cooperativa';
  }

  roleIcon(user: DemoUser): string {
    return user.experience === 'FARMER' ? 'agriculture' : 'groups';
  }
}
