import { Routes } from '@angular/router';
import { LoginPage } from './Pages/login/login';
import { DashboardPage } from './Pages/dashboard/dashboard';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'dashboard', component: DashboardPage },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
