import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card';
import { Divider } from '@nextui-org/divider';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import Link from 'next/link';
import '../app/globals.css';
import { MailIcon } from '@/components/MailIcon';
import { EyeFilledIcon } from '@/components/EyeFilledIcon';
import { EyeSlashFilledIcon } from '@/components/EyeSlashFilledIcon';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const validatePassword = (password: string) => {
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasCapitalLetter = /[A-Z]/.test(password);
  const isValidLength = password.length >= 8;

  return isValidLength && hasSymbol && hasCapitalLetter;
};

function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function SignUp() {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isPasswordValid, setIsPasswordValid] = React.useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = React.useState(false);
  const [isInvalidEmail, setIsInvalidEmail] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const router = useRouter();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setIsPasswordValid(validatePassword(value));
    setIsConfirmPasswordValid(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setIsConfirmPasswordValid(value === password);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setIsInvalidEmail(!validateEmail(value));
  };

  const handleSignUp = async () => {
    if (!isPasswordValid || !isConfirmPasswordValid || isInvalidEmail) return;

    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document with initial structure
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
      });

      // Initialize subcollections
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const budgetsRef = collection(db, 'users', user.uid, 'budgets');
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const stockRef = collection(db, 'users', user.uid, 'stocks');

      // Add a sample document to initialize the subcollections
      await setDoc(doc(transactionsRef, 'init'), {});
      await setDoc(doc(budgetsRef, 'init'), {});
      await setDoc(doc(categoriesRef, 'init'), {});
      await setDoc(doc(stockRef, 'init'), {});

      console.log('User registered and subcollections initialized successfully');

      await signInWithEmailAndPassword(auth, email, password);
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
      router.push('/');
    } catch (error : any) {
      console.error('Error registering user:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const [isVisible1, setIsVisible1] = React.useState(false);
  const toggleVisibility1 = () => setIsVisible1(!isVisible1);

  const [isVisible2, setIsVisible2] = React.useState(false);
  const toggleVisibility2 = () => setIsVisible2(!isVisible2);

  const validateEmail = (value: string) => {
    return value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Card className="max-w-[1000px] bg-transparent p-10">
        <CardHeader className="flex gap-3 items-center">
          <div className="flex flex-col w-full">
            <span>
              <h1 className="font-bold text-4xl text-white">Welcome to FlowPro! 👋</h1>
            </span>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="w-80% h-80%">
          <div className="grid dark gap-4 w-full">
            <p className="text-sm font-medium text-white">First Name</p>
            <Input 
              color='default' 
              isRequired 
              placeholder="Type your first name here" 
              onChange={(e) => setFirstName(e.target.value)} 
            />
            <p className="text-sm font-medium text-white">Last Name</p>
            <Input 
              color='default' 
              isRequired 
              placeholder="Type your last name here" 
              onChange={(e) => setLastName(e.target.value)} 
            />
            <p className="text-sm font-medium text-white">Email</p>
            <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
              <Input
                type="email"
                placeholder="you@example.com"
                color={isInvalidEmail ? "danger" : "default"}
                onChange={(e) => handleEmailChange(e.target.value)}
                endContent={
                  <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
              />
            </div>
            {isInvalidEmail && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid email</p>
            )}
            <p className="text-sm font-medium text-white">Password</p>
            <Input
              placeholder="********"
              onChange={(e) => handlePasswordChange(e.target.value)}
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
              className={`max-w-ms ${!isPasswordValid && "border-red-500"}`}
            />
            {!isPasswordValid && password && (
              <p className="text-xs text-red-500 mt-1">At least 8 characters including one symbol and one capital letter</p>
            )}

            <p className="text-sm font-medium text-white">Confirm Password</p>
            <Input
              placeholder="********"
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility2}
                >
                  {isVisible2 ? (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible2 ? "text" : "password"}
              className={`max-w-ms ${!isConfirmPasswordValid && "border-red-500"}`}
            />
          </div>
          {!isConfirmPasswordValid && (password && confirmPassword) && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </CardBody>
        <Divider />
        <CardFooter className="flex flex-col items-center w-full">
          <Button
            className="w-full text-white font-medium dark"
            color="secondary"
            variant="bordered"
            onClick={handleSignUp}
            isLoading={isLoading}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up for Free'}
          </Button>
          <p className="text-sm font-medium text-white mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
