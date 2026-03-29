
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventList } from './event-list/event-list';
import { EventDetail } from './event-detail/event-detail';

const routes: Routes = [
  { path: '', component: EventList },
  { path: ':id', component: EventDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
