import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loggedUserSchema } from './types/auth';
import { z } from 'zod';
import { graphqlUrl } from './components/providers/GraphqlProvider';

function redirectToDashboard(userRole: string | undefined, request: NextRequest) {
  switch (userRole) {
    case 'admin':
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    case 'root':
    case 'manager':
      return NextResponse.redirect(new URL('/dashboard', request.url));
    default:
      return NextResponse.redirect(new URL(`/${userRole}/leads`, request.url));
  }
}

async function fetchUserPermissions(token: string) {
  try {
    const response = await fetch(`${graphqlUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-lead-token ${token}`,
      },
      body: JSON.stringify({
        query: `
          query GetRolePermissions {
            getRolePermissions 
          }
        `,
      }),
    });
    const data = await response.json();
    const role = data.data.getRolePermissions?.[0]?.role?.name.toLowerCase()
    return {
      resource: data.data.getRolePermissions?.[0]?.permission.resource,
      // resource: 'Hhh',
      role,
    };
  } catch (error) {
    console.log(error, "error")
    return { resource: '', role: null };
  }
}

export async function middleware(request: NextRequest) {
  const unauthenticatedPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/admin/login',
  ];

  const token = request.cookies.get('x-lead-token')?.value;

  let parsedToken: any = null; // Default to null if parsing fails
  if (token) {
    try {
      parsedToken = JSON.parse(token);
    } catch (error) {
      console.error('Failed to parse token:', error);
    }
  }

  const currentUser = request.cookies.get('x-lead-user')?.value;
  let user: z.infer<typeof loggedUserSchema> | null = null;

  if (token && currentUser) {
    try {
      user = JSON.parse(currentUser) as z.infer<typeof loggedUserSchema>;
    } catch (error) {
      console.error('Invalid token: [MIDDLEWARE]', error);
    }
  }

  const isAuthenticated = !!token;
  const userRole = user?.role?.name?.split(" ").join("").toLowerCase();

  const path = request.nextUrl.pathname;

  if (unauthenticatedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (isAuthenticated) {
      return redirectToDashboard(userRole, request);
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Skip role-based condition for admin and root
  if (userRole === "root" || userRole == "admin") {
    return NextResponse.next();
  }

  try {
    const { resource } = await fetchUserPermissions(parsedToken);
    const resourcePath = resource.toLowerCase();
    if ((resourcePath === 'lead' || resourcePath === 'prospect') && path.includes('/leads') || path.includes('/prospects')) {
      return NextResponse.next();
    } if (path.includes(`/${userRole}/values`)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
