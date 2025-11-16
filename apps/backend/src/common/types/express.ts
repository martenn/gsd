// Type augmentation for Express Request - extends Request with custom properties
// Note: Passport already defines user property, so we only augment id here
// For user property, use type assertion: (request.user as JwtUser | undefined)
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

// Export empty object to make this a module
export {};
