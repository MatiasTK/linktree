import { headers } from "next/headers";

// Cloudflare Access headers
const CF_ACCESS_AUTHENTICATED_USER_EMAIL = "cf-access-authenticated-user-email";
const CF_ACCESS_JWT_ASSERTION = "cf-access-jwt-assertion";

export interface AuthUser {
  email: string;
  isAuthenticated: boolean;
}

/**
 * Check if request is authenticated via Cloudflare Access
 * In development, bypass auth check
 */
export async function getAuthUser(): Promise<AuthUser> {
  const headersList = await headers();
  
  // In development mode, allow all requests
  if (process.env.NODE_ENV === "development") {
    return {
      email: "dev@localhost",
      isAuthenticated: true,
    };
  }

  const email = headersList.get(CF_ACCESS_AUTHENTICATED_USER_EMAIL);
  const jwt = headersList.get(CF_ACCESS_JWT_ASSERTION);

  return {
    email: email || "",
    isAuthenticated: !!(email && jwt),
  };
}

/**
 * Verify that the request is authenticated
 * Returns the user if authenticated, throws if not
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user.isAuthenticated) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
