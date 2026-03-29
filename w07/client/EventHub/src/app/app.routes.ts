import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: '', redirectTo: 'events', pathMatch: 'full' },
	{ path: 'auth', loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule) },
	{ path: 'events', loadChildren: () => import('./features/events/events-module').then(m => m.EventsModule) },
	{ path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(c => c.CartComponent) },
	{ path: 'tickets', loadChildren: () => import('./features/tickets/tickets-module').then(m => m.TicketsModule) },
	{ path: 'reservations', loadChildren: () => import('./features/reservations/reservations-module').then(m => m.ReservationsModule) },
	{ path: 'sales', loadChildren: () => import('./features/sales/sales-module').then(m => m.SalesModule) },
	{ path: 'payments', loadChildren: () => import('./features/payments/payments-module').then(m => m.PaymentsModule) },
	{ path: 'refunds', loadChildren: () => import('./features/refunds/refunds-module').then(m => m.RefundsModule) },
	{ path: 'users', loadChildren: () => import('./features/users/users-module').then(m => m.UsersModule) },
	{ path: '**', redirectTo: 'events' }
];
