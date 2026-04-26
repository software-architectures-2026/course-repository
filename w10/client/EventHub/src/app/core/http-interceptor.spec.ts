import { authInterceptor } from './http-interceptor';

describe('authInterceptor', () => {
  it('should be a function', () => {
    expect(typeof authInterceptor).toBe('function');
  });
});
