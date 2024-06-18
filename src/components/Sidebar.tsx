import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Image, Card, CardHeader, CardBody, CardFooter } from "@nextui-org/react";
import { getAuth, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userdat : any = userDoc.data()
          setUser(userdat);
        }
      }
    };

    fetchUserData();
  }, [auth]);


  const handleLogout = async () => {
    await signOut(auth)
    const router = useRouter()
    router.push('/login');
  };

  const authValue = auth.currentUser ? auth.currentUser.email : '';

  return (
    <div>
      <div className='absolute w-56 bg-gradient-to-b from-pink-900 via-orange-500 to-teal-500 to-blue-500 to-blue-100 h-screen -z-1'></div>
      <Card isBlurred className="ml-4 sidebar h-5/6 mt-4">
        <CardHeader className="bg-black text-center justify-center items-center">
          <Image
            width={200}
            height={400}
            alt="FlowPro Logo"
            src="https://media.discordapp.net/attachments/1073389677073145876/1252409799212011692/flowprobanner.png?ex=66721d04&is=6670cb84&hm=f277a4c1ef8f81ce1408a474827f1bcc328514a2345d5d66f057301670ec745c&=&format=webp&quality=lossless"
          />
        </CardHeader>
        <CardBody className="w-64 h-full bg-black text-white">
          {user && (user as any).firstName && (
            <h3 className="text-xl w-full text-white mt-2 text-center">
              Welcome {(user as any).firstName[0].toUpperCase() + (user as any).firstName.substring(1)}
            </h3>
          )}
          <div className="flex-grow">
            <nav className="flex flex-col mt-10 px-4 space-y-6">
              <Link href="/" className="flex items-center p-2 space-x-2 hover:bg-gray-700 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link href="/transactions" className="flex items-center p-2 space-x-2 hover:bg-gray-700 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add Transaction</span>
              </Link>
              <Link href="/crypto" className="flex items-center p-2 space-x-2 hover:bg-gray-700 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
                <span>Crypto</span>
              </Link>
            </nav>
          </div>
        </CardBody>
        <CardFooter className="bg-black w-64 text-left">
            <Link href="/login" onClick={handleLogout} className="flex items-center p-2 space-x-2 hover:bg-gray-700 rounded-md text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                <span>Logout</span>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
