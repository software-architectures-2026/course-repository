import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService, EventDto } from '../event.service';
import { BehaviorSubject, Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, catchError } from 'rxjs/operators';

interface Filters {
  q: string;
  category: string;
  location: string;
  start_from: string;
  start_to: string;
  sort: string;
  min_price: number | null;
  max_price: number | null;
  published: boolean | null;
  page: number;
  limit: number;
}

type ExtendedEvent = EventDto & { start?: Date | null };

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './event-list.html',
  styleUrls: ['./event-list.scss'],
})
export class EventList implements OnInit {
  private eventService = inject(EventService);
  events$ = new BehaviorSubject<ExtendedEvent[]>([]);
  loading$!: Observable<boolean>;
  private loading = new BehaviorSubject<boolean>(true);

  // filters stored as a plain object for two-way binding
  filters: Filters = {
    q: '',
    category: '',
    location: '',
    start_from: '',
    start_to: '',
    sort: 'start_time',
    min_price: null,
    max_price: null,
    published: null,
    page: 1,
    limit: 12,
  };

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.loading$ = this.loading.asObservable();

    // debounce typing in the search box, but allow explicit Filter button too
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      this.filters['q'] = q;
      this.loadEvents();
    });

    this.loadEvents();
  }

  onSearchChange(q: string) {
    this.search$.next(q);
  }

  private buildOpts(): Record<string, any> {
    const opts: Record<string, any> = {};
    const q = this.filters['q'];
    const category = this.filters['category'];
    const location = this.filters['location'];
    const start_from = this.filters['start_from'];
    const start_to = this.filters['start_to'];
    const sort = this.filters['sort'];
    const min_price = this.filters['min_price'];
    const max_price = this.filters['max_price'];
    const published = this.filters['published'];
    const page = this.filters['page'];
    const limit = this.filters['limit'];

    if (q) opts['q'] = q;
    if (category) opts['category'] = category;
    if (location) opts['location'] = location;
    if (start_from) opts['start_from'] = start_from;
    if (start_to) opts['start_to'] = start_to;
    if (sort) opts['sort'] = sort;
    if (min_price !== null && min_price !== undefined) opts['min_price'] = min_price;
    if (max_price !== null && max_price !== undefined) opts['max_price'] = max_price;
    if (published !== null && published !== undefined) opts['published'] = published;
    if (page) opts['page'] = page;
    if (limit) opts['limit'] = limit;
    return opts;
  }

  loadEvents() {
    const opts = this.buildOpts();
    this.loading.next(true);
    this.eventService
      .listEvents(opts)
      .pipe(
        map((rows: EventDto[]) => (rows || []).map((r: any) => ({ ...r, start: r.start_time ? new Date(r.start_time) : null }) as ExtendedEvent)),
        catchError(() => of([] as ExtendedEvent[]))
      )
      .subscribe((rows: ExtendedEvent[]) => {
        this.events$.next(rows || []);
        this.loading.next(false);
      });
  }

  onFilter() {
    this.loadEvents();
  }

  onReset() {
    this.filters = {
      q: '',
      category: '',
      location: '',
      start_from: '',
      start_to: '',
      sort: 'start_time',
      min_price: null,
      max_price: null,
      published: null,
      page: 1,
      limit: 12,
    };
    this.loadEvents();
  }

  trackById(_i: number, e: any) {
    return e?.event_id || _i;
  }
}
