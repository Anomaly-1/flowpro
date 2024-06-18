import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import Link from 'next/link';
import "../app/globals.css";
import { MailIcon } from '@/components/MailIcon';
import { EyeFilledIcon } from '@/components/EyeFilledIcon';
import { EyeSlashFilledIcon } from '@/components/EyeSlashFilledIcon';
import React, { useState } from "react";
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Cookies from 'js-cookie';
import * as jose from 'jose';

// Initialize Firebase app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export default function Login() {
  const [isVisible1, setIsVisible1] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const toggleVisibility1 = () => setIsVisible1(!isVisible1);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Sign in the user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get the ID token from Firebase
      const token = await userCredential.user.getIdToken();

      // Create a JWT with the Firebase ID token as payload
      const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
      const jwttoken = await new jose.SignJWT({ token })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(secret);

      // Store the JWT in cookies
      Cookies.set('auth_token', jwttoken, { expires: 1 }); // Expires in 1 day

      // Redirect to "/" after successful login
      router.push("/");
    } catch (error) {
      console.error('Error logging in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Card className="max-w-[1000px] bg-transparent p-10">
        <CardHeader className="flex gap-3 items-center">
          <div className="flex flex-col w-full">
            <span>
                <h1 className="font-bold text-4xl text-white">Welcome Back! 👋</h1>
            </span>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="w-full">
          <div className="grid dark gap-4 w-full">
            <p className="text-sm font-medium text-white">Email</p>
            <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
              <Input
                type="email"
                placeholder="you@example.com"
                color="default"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                endContent={<MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />}
              />
            </div>
            <p className="text-sm font-medium text-white">Password</p>
            <Input
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility1}
                >
                  {isVisible1 ? (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible1 ? "text" : "password"}
              className='max-w-ms'
            />
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="flex flex-col items-center w-full">
          <Button 
            className="w-full text-white font-medium dark"
            color="secondary"
            variant="bordered"
            onClick={handleLogin}
            isLoading={isLoading}
          >
            {isLoading ? 'Loading' : 'Login'}
          </Button>
          <p className="text-sm font-medium text-white mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
