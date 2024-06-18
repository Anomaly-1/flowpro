import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Chart from '../components/Chart';
import { Select, SelectItem, Card, CardBody, Input, Button } from '@nextui-org/react';
import React from "react";
import { initializeApp } from 'firebase/app';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
const API_KEY = process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY;

const fetchData = async (interval: 'minute' | 'hourly' | 'daily', currency: 'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'XLM') => {
  const endpoints = {
    minute: `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${currency}&tsym=USD&limit=10&api_key=${API_KEY}`,
    hourly: `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${currency}&tsym=USD&limit=10&api_key=${API_KEY}`,
    daily: `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${currency}&tsym=USD&limit=10&api_key=${API_KEY}`
  };

  const endpoint = endpoints[interval];
  console.log(`Fetching data from: ${endpoint}`);

  try {
    const response = await axios.get(endpoint);
    console.log('Fetched data:', response.data.Data.Data);
    return response.data.Data.Data;
  } catch (error) {
    console.error(`Error fetching ${interval} data:`, error);
    return [];
  }
};

const fetchPrice = async (currency: 'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'XLM') => {
  const endpoint = `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD&api_key=${API_KEY}`;

  try {
    const response = await axios.get(endpoint);
    return response.data.USD;
  } catch (error) {
    console.error(`Error fetching ${currency} price:`, error);
    return 0;
  }
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

const saveTransaction = async (currency: string, amount: number) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const currentdate = new Date();
      await addDoc(collection(db, `users/${user.uid}/stocks`), {
        userId: user.uid,
        currency: currency,
        amount: amount,
        timestamp: `${currentdate.getMonth() + 1}/${currentdate.getDate()}/${currentdate.getFullYear()}`,
      });
      alert('Transaction saved successfully!');
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  } else {
    alert('No user is signed in');
  }
};

export default function Crypto() {
  const [interval, setInterval] = useState<'minute' | 'hourly' | 'daily'>('minute');
  const [currency, setCurrency] = useState<'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'XLM'>('BTC');
  const [data, setData] = useState<any[]>([]);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (currency) {
      const fetchDataAsync = async () => {
        const fetchedData = await fetchData(interval, currency);
        setData(fetchedData);
      };
      fetchDataAsync();
    }
  }, [interval, currency]);

  const handleIntervalChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInterval(intervalOptions[parseInt(event.target.value)] as 'minute' | 'hourly' | 'daily');
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(currencyOptions[parseInt(event.target.value)] as 'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'XLM');
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(event.target.value));
  };

  const handleSaveTransaction = async () => {
    const price = await fetchPrice(currency);
    const convertedAmount = amount * price;
    await saveTransaction(currency, convertedAmount);
  };

  const series = data.length > 0 ? [{
    data: data.map((item: any) => ({
      x: new Date(item.time * 1000),
      y: [item.open, item.high, item.low, item.close]
    }))
  }] : [];

  const options = {
    chart: {
      type: 'candlestick',
      background: '#000',
    },
    title: {
      text: `${currency} ${interval} data`,
      align: 'left',
      style: {
        color: '#fff'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#fff'
        }
      },
      title: {
        text: 'Time',
        style: {
          color: '#fff'
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#fff'
        },
        formatter: (value: number) => `$${value.toFixed(2)}`
      },
      title: {
        text: 'Price ($)',
        style: {
          color: '#fff'
        }
      }
    }
  };

  const intervalOptions: any = {
    1: 'minute',
    2: 'hourly',
    3: 'daily'
  };

  const currencyOptions: any = {
    1: 'BTC',
    2: 'ETH',
    3: 'XRP',
    4: 'LTC',
    5: 'BCH',
    6: 'XLM'
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col items-center w-full p-4 m-8 bg-black rounded-lg justify-center">
        <Card className="flex flex-col w-full max-w-4xl p-4 bg-black rounded-lg justify-center items-center">
          <CardBody className="p-4 justify-content w-full items-center">
            {data.length > 0 ? (
              <Chart
                type="candlestick"
                options={options}
                series={series}
                height={600}
                width={800}
              />
            ) : (
              <p className="text-white">Loading data...</p>
            )}
            <div className="flex flex-col mt-4 space-y-4 w-full">
              <Select
                value={Object.keys(intervalOptions).find(key => intervalOptions[key] === interval)}
                onChange={handleIntervalChange}
                label="Select Interval"
                variant="bordered"
                className="bg-black text-white"
              >
                {Object.entries(intervalOptions).map(([key, value]) => (
                  <SelectItem key={key} className="text-white bg-black" value={key}>{value}</SelectItem>
                ))}
              </Select>
              <Select
                value={Object.keys(currencyOptions).find(key => currencyOptions[key] === currency)}
                onChange={handleCurrencyChange}
                label="Select Currency"
                variant="bordered"
                className="bg-black text-white"
              >
                {Object.entries(currencyOptions).map(([key, value]) => (
                  <SelectItem key={key} className="text-white bg-black" value={key}>{value}</SelectItem>
                ))}
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={amount.toString()}
                onChange={handleAmountChange}
                fullWidth
                variant="underlined"
                color="primary"
                className="text-white bg-black"
                aria-label="Amount"
              />
              <Button
                onClick={handleSaveTransaction}
                color="success"
                disabled={!currency}
                className="w-full"
              >
                Save Transaction
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
