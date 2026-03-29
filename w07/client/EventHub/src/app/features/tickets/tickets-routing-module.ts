import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TicketList } from './ticket-list/ticket-list';
import { TicketDetail } from './ticket-detail/ticket-detail';
import { authGuard } from '../../core/auth-guard';

const routes: Routes = [
  { path: '', component: TicketList, canActivate: [authGuard] },
  { path: ':id', component: TicketDetail, canActivate: [authGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TicketsRoutingModule {}
