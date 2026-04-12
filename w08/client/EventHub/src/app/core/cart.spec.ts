import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart';

describe('CartService', () => {
  let service: CartService;
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    const mockLocalStorage = {
      getItem: (key: string) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null),
      setItem: (key: string, value: string) => {
        storage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    };

    (window as any).localStorage = mockLocalStorage;

    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    // clean up mocked storage
    (window as any).localStorage.clear();
  });

  it('add() merges items with same eventId and ticketTypeId by increasing quantity', () => {
    const a: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't1', ticketTypeName: 'T1', price: 10, quantity: 1 };
    const b: CartItem = { ...a, quantity: 2 };

    service.add(a);
    service.add(b);

    const items = service.getItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);
  });

  it('add() creates a new entry when eventId or ticketTypeId differ', () => {
    const a: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't1', ticketTypeName: 'T1', price: 10, quantity: 1 };
    const b: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't2', ticketTypeName: 'T2', price: 15, quantity: 1 };
    const c: CartItem = { eventId: 'e2', eventTitle: 'E2', ticketTypeId: 't1', ticketTypeName: 'T1', price: 12, quantity: 1 };

    service.add(a);
    service.add(b);
    service.add(c);

    const items = service.getItems();
    expect(items.length).toBe(3);
    // ensure distinct entries preserved
    expect(items.some((it) => it.ticketTypeId === 't2')).toBe(true);
    expect(items.some((it) => it.eventId === 'e2')).toBe(true);
  });

  it('remove() correctly removes the item at the given index', () => {
    const a: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't1', ticketTypeName: 'T1', price: 10, quantity: 1 };
    const b: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't2', ticketTypeName: 'T2', price: 15, quantity: 1 };

    service.add(a);
    service.add(b);

    service.remove(0);
    const items = service.getItems();
    expect(items.length).toBe(1);
    expect(items[0].ticketTypeId).toBe('t2');
  });

  it('clear() empties the cart', () => {
    const a: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't1', ticketTypeName: 'T1', price: 10, quantity: 1 };
    service.add(a);

    expect(service.getItems().length).toBeGreaterThan(0);
    service.clear();
    expect(service.getItems().length).toBe(0);
  });

  it('getItems() returns the current state after add/remove operations', () => {
    const a: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't1', ticketTypeName: 'T1', price: 10, quantity: 1 };
    const b: CartItem = { eventId: 'e1', eventTitle: 'E1', ticketTypeId: 't2', ticketTypeName: 'T2', price: 15, quantity: 2 };

    service.add(a);
    service.add(b);
    let items = service.getItems();
    expect(items.length).toBe(2);

    service.remove(1);
    items = service.getItems();
    expect(items.length).toBe(1);
    expect(items[0].ticketTypeId).toBe('t1');
  });
});
