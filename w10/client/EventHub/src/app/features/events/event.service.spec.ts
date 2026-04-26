import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventService, EventDto } from './event.service';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting(), EventService],
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listEvents() makes a GET request to /api/events with correct query parameters', () => {
    const opts = { published: true, page: 2, limit: 10, q: 'search' };
    let result: EventDto[] | undefined;

    service.listEvents(opts).subscribe((r) => (result = r));

    const expectedUrl = `${(service as any).baseUrl}/api/events`;
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);

    expect(req.request.params.get('published')).toBe('true');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('q')).toBe('search');

    const mock: EventDto[] = [
      {
        event_id: 'e1',
        organizer_id: 'o1',
        title: 'Event 1',
        location: 'Room',
        start_time: '2026-04-14T10:00:00.000Z',
        end_time: '2026-04-14T11:00:00.000Z',
        visibility: true,
        published: true,
      },
    ];
    req.flush(mock);

    expect(result).toBeDefined();
    expect(result && result.length).toBe(1);
  });

  it('listEvents() returns an empty array when the API returns null', () => {
    let result: EventDto[] | undefined;
    service.listEvents().subscribe((r) => (result = r));

    const expectedUrl = `${(service as any).baseUrl}/api/events`;
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);
    req.flush(null);

    expect(result).toEqual([]);
  });

  it('getEvent() makes a GET request to /api/events/:id', () => {
    const id = 'e-123';
    let result: EventDto | null | undefined;
    service.getEvent(id).subscribe((r) => (result = r));

    const expectedUrl = `${(service as any).baseUrl}/api/events/${encodeURIComponent(id)}`;
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);

    const mock: EventDto = {
      event_id: id,
      organizer_id: 'o1',
      title: 'Event',
      location: 'Hall',
      start_time: '2026-04-14T10:00:00.000Z',
      end_time: '2026-04-14T11:00:00.000Z',
      visibility: true,
      published: false,
    };
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getEvent() returns null when the API returns null', () => {
    const id = 'does-not-exist';
    let result: EventDto | null | undefined;
    service.getEvent(id).subscribe((r) => (result = r));

    const expectedUrl = `${(service as any).baseUrl}/api/events/${encodeURIComponent(id)}`;
    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === expectedUrl);
    req.flush(null);

    expect(result).toBeNull();
  });
});
