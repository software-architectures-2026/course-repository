import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../event.service';
import { Observable, map, startWith, catchError, of } from 'rxjs';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-list.html',
  styleUrls: ['./event-list.scss'],
})
export class EventList implements OnInit {
  private eventService = inject(EventService);

  events$: Observable<any[]> = of([]);
  loading$!: Observable<boolean>;

  ngOnInit(): void {
    // Expose observable so template can use async pipe (triggers CD when data arrives)
    this.events$ = this.eventService.listEvents().pipe(
      map((rows: any[]) => (rows || []).map((r: any) => ({ ...r, start: r.start_time ? new Date(r.start_time) : null }))),
      catchError(() => of([]))
    );

    // loading indicator: startWith an empty array then replace when data arrives
    this.loading$ = this.events$.pipe(map((arr) => arr.length === 0), startWith(true));
  }
}
