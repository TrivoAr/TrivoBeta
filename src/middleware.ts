// Temporarily disable middleware for debugging
export function middleware(_req: any) {
  // Allow all requests for now
  return;
}

export const config = {
  matcher: [], // Disable matcher temporarily
};
