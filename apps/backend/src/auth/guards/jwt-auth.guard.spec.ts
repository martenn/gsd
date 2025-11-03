import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });
});
