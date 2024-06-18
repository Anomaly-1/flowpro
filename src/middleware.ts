import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

export async function middleware(request: NextRequest) {
  const token : any = request.cookies.get('auth_token');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
    const { payload } = await jose.jwtVerify(token.value.toString(), secret);
    if (payload) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error('JWT verification failed:', error);
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

// Specify the route matcher
export const config = {
  matcher: ['/', '/crypto', '/transactions'], // Apply middleware to these routes
};
