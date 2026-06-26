import { Routes } from '@angular/router';
import { LoginPage } from './Pages/login/login';
import { DashboardPage } from './Pages/dashboard/dashboard';
import { ThanhLi } from './Pages/thanh-li/thanh-li';
import { PersonalInformationComponent } from './Pages/PersonalAccount/personal-information/personal-information';
import { PersonalBookshelfComponent } from './Pages/PersonalAccount/personal-bookshelf/personal-bookshelf';
import { OrderManagementComponent } from './Pages/PersonalAccount/order-management/order-management';
import { AchievementComponent } from './Pages/PersonalAccount/achievement/achievement';
import { TransactionHistoryComponent } from './Pages/PersonalAccount/transaction-history/transaction-history';
import { CustomerSupportComponent } from './Pages/PersonalAccount/customer-support/customer-support';
import { AddressComponent } from './Pages/PersonalAccount/address/address';
import { AccountSecurityComponent } from './Pages/PersonalAccount/account-security/account-security';
import { LinkSocialComponent } from './Pages/PersonalAccount/link-social/link-social';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'dashboard', component: DashboardPage },
  { path: 'thanh-li', component: ThanhLi },
  {
    path: 'PersonalAccount',
    children: [
      { path: '', redirectTo: 'personal-information', pathMatch: 'full' },
      { path: 'personal-information', component: PersonalInformationComponent },
      { path: 'personal-bookshelf', component: PersonalBookshelfComponent },
      { path: 'order-management', component: OrderManagementComponent },
      { path: 'achievement', component: AchievementComponent },
      { path: 'transaction-history', component: TransactionHistoryComponent },
      { path: 'customer-support', component: CustomerSupportComponent },
      { path: 'address', component: AddressComponent },
      { path: 'account-security', component: AccountSecurityComponent },
      { path: 'link-social', component: LinkSocialComponent }
    ]
  },
  // Redirect flat paths to nested ones for convenience
  { path: 'personal-info', redirectTo: 'PersonalAccount/personal-information', pathMatch: 'full' },
  { path: 'bookshelf', redirectTo: 'PersonalAccount/personal-bookshelf', pathMatch: 'full' },
  { path: 'orders', redirectTo: 'PersonalAccount/order-management', pathMatch: 'full' },
  { path: 'achievements', redirectTo: 'PersonalAccount/achievement', pathMatch: 'full' },
  { path: 'transactions', redirectTo: 'PersonalAccount/transaction-history', pathMatch: 'full' },
  { path: 'support', redirectTo: 'PersonalAccount/customer-support', pathMatch: 'full' },
  { path: 'address', redirectTo: 'PersonalAccount/address', pathMatch: 'full' },
  { path: 'security', redirectTo: 'PersonalAccount/account-security', pathMatch: 'full' },
  { path: 'social', redirectTo: 'PersonalAccount/link-social', pathMatch: 'full' },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
