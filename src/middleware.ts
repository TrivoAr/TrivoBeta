// Temporarily disable middleware for debugging
export function middleware(req: any) {
  // Allow all requests for now
  return;
}

export const config = { 
  matcher: [] // Disable matcher temporarily
};