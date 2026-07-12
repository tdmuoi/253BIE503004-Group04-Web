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
import { NotificationsComponent } from './Pages/PersonalAccount/notifications/notifications';
import { Cart } from './Pages/cart/cart';
import { DatHang } from './Pages/dat-hang/dat-hang';
import { DatHangThanhCong } from './Pages/dat-hang-thanh-cong/dat-hang-thanh-cong';
import { AboutUs } from './Pages/about-us/about-us';
import { Policy } from './Pages/policy/policy';
import { Homepage } from './Pages/homepage/homepage';
import { SachDienTu } from './Pages/sach-dien-tu/sach-dien-tu';
import { BooksDetailComponent } from './Pages/books-detail/books-detail';

// --- ADMIN IMPORTS ---
import { AdminLayoutComponent } from './Pages/admin/admin-layout/admin-layout';
import { AdminDashboardComponent } from './Pages/admin/admin-dashboard/admin-dashboard';
import { AdminOrdersComponent } from './Pages/admin/admin-orders/admin-orders';
import { AdminOrderDetailsComponent } from './Pages/admin/admin-order-details/admin-order-details';
import { AdminReturnsComponent } from './Pages/admin/admin-returns/admin-returns';
import { AdminCustomersComponent } from './Pages/admin/admin-customers/admin-customers';
import { AdminCustomerDetailsComponent } from './Pages/admin/admin-customer-details/admin-customer-details';
import { AdminProductsComponent } from './Pages/admin/admin-products/admin-products';
import { AdminSettingsComponent } from './Pages/admin/admin-settings/admin-settings';

export const routes: Routes = [
  // ... Admin Routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'orders/:id', component: AdminOrderDetailsComponent },
      { path: 'returns', component: AdminReturnsComponent },
      { path: 'customers', component: AdminCustomersComponent },
      { path: 'customers/:id', component: AdminCustomerDetailsComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  },
  
  { path: 'book-detail/:id', component: BooksDetailComponent },
  { path: 'book-detail', component: BooksDetailComponent },
  { path: 'homepage', component: Homepage },
  { path: 'sach-dien-tu', component: SachDienTu },
  { path: 'about-us', component: AboutUs },
  { path: 'policy', component: Policy },
  { path: 'login', component: LoginPage },
  { path: 'dashboard', component: DashboardPage },
  { path: 'thanh-li', component: ThanhLi },
  { path: 'cart', component: Cart },
  { path: 'dat-hang', component: DatHang },
  { path: 'dat-hang-thanh-cong', component: DatHangThanhCong },
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
      { path: 'link-social', component: LinkSocialComponent },
      { path: 'notifications', component: NotificationsComponent }
    ]
  },
  // Redirect flat paths to nested ones for convenience
  { path: 'notifications-list', redirectTo: 'PersonalAccount/notifications', pathMatch: 'full' },
  { path: 'personal-info', redirectTo: 'PersonalAccount/personal-information', pathMatch: 'full' },
  { path: 'bookshelf', redirectTo: 'PersonalAccount/personal-bookshelf', pathMatch: 'full' },
  { path: 'orders', redirectTo: 'PersonalAccount/order-management', pathMatch: 'full' },
  { path: 'achievements', redirectTo: 'PersonalAccount/achievement', pathMatch: 'full' },
  { path: 'transactions', redirectTo: 'PersonalAccount/transaction-history', pathMatch: 'full' },
  { path: 'support', redirectTo: 'PersonalAccount/customer-support', pathMatch: 'full' },
  { path: 'address', redirectTo: 'PersonalAccount/address', pathMatch: 'full' },
  { path: 'security', redirectTo: 'PersonalAccount/account-security', pathMatch: 'full' },
  { path: 'social', redirectTo: 'PersonalAccount/link-social', pathMatch: 'full' },
  { path: '', redirectTo: 'homepage', pathMatch: 'full' }
];
