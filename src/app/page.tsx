'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Chart from '../components/Chart';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Skeleton, Card, Progress } from '@nextui-org/react';
import { Spotlight } from '../components/Spotlight'

export default function Home() {
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
  const [data, setData] = useState({
    netWorth: [],
    monthlySpending: [],
    monthlyIncome: [],
    netBalance: [],
    income: 0,
    categories: {
      names: [],
      amounts: [],
    },
    budget:0,
    budgetlim:0,
    maxnetworth:0,
    lowestnetworth:0,
    assets: {
      names: [],
      prices: [],
    },
  });

  const [transactdata, setTransactionData] = useState([]);
  const [stockData, setStockData] = useState({
    names: [],
    amounts: [],
    totalValue: 0,
  });


  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (userId : any) => {
      try {
        const transactionsRef = collection(db, `users/${userId}/transactions`);
        const budgetsRef = collection(db, `users/${userId}/budgets`);
        const assetsRef = collection(db, `users/${userId}/assets`);
        const stocksRef = collection(db, `users/${userId}/stocks`);

        const transactionsSnap = await getDocs(transactionsRef);
        const budgetsSnap = await getDocs(budgetsRef);
        const assetsSnap = await getDocs(assetsRef);
        const stocksSnap = await getDocs(stocksRef);

        let transactions : any = transactionsSnap.docs.map(doc => doc.data());
        const budgets = budgetsSnap.docs.map(doc => doc.data());
        const assets = assetsSnap.docs.map(doc => doc.data());
        const stocks = stocksSnap.docs.map(doc => doc.data());
        

        // Sort transactions by timestamp
        transactions.sort((a : any, b : any) => new Date(b.timestamp) - new Date(a.timestamp));

        setTransactionData(transactions);

        let monthlyNetIncome = Array(12).fill(0);
        let monthlySpending = Array(12).fill(0);
        let monthlyIncome = Array(12).fill(0);
        let income = 0;
        let categoryTotals : any = {};
        let categories : any = [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const lastMonth = (currentMonth - 1 + 12) % 12;
        const lastLastMonth = (currentMonth - 2 + 12) % 12;
        const nextMonth = (currentMonth + 1) % 12;

        transactions.forEach(transaction => {
          const { amount, type, category, timestamp } = transaction;
          const date = new Date(timestamp);
          const month = date.getMonth();

          if (type === 'add') {
            income += amount;
            monthlyIncome[month] += amount;
          } else if (type === 'subtract') {
            monthlySpending[month] += amount;
            if (month >= lastLastMonth && month <= nextMonth) {
              if (categoryTotals[category]) {
                categoryTotals[category] += amount;
              } else {
                categoryTotals[category] = amount;
                categories.push(category);
              }
            }
          }
        });

        monthlyNetIncome = monthlyIncome.map((income, index) => income - monthlySpending[index]);

        // Calculate cumulative net worth
        let cumulativeNetWorth = Array(12).fill(0);
        cumulativeNetWorth[0] = monthlyNetIncome[0];

        for (let i = 1; i < 12; i++) {
          cumulativeNetWorth[i] = cumulativeNetWorth[i - 1] + monthlyNetIncome[i];
        }

        // Add assets to net worth
        assets.forEach(asset => {
          const { price, timestamp } = asset;
          const date = new Date(timestamp);
          const month = date.getMonth();

          for (let i = month; i < 12; i++) {
            cumulativeNetWorth[i] += price;
          }
        });

        let maxNetWorth = cumulativeNetWorth[0]
        // let lowestNetWorth = cumulativeNetWorth[0]
        for (let i = 1; i < 12; i++) {
          if (cumulativeNetWorth[i] > maxNetWorth) {
            maxNetWorth = cumulativeNetWorth[i]
          }
          // if (cumulativeNetWorth[i] < lowestNetWorth) {
          //   lowestNetWorth = cumulativeNetWorth[i]
          // }
        }

        const assetPrices = assets.map(asset => asset.price);
        const assetNames = assets.map(asset => asset.name);

        const categoryAmounts = categories.map(category => categoryTotals[category]);

        const filteredNetWorth = [
          cumulativeNetWorth[lastLastMonth],
          cumulativeNetWorth[lastMonth],
          cumulativeNetWorth[currentMonth],
          cumulativeNetWorth[nextMonth],
        ];
        const filteredSpending = [
          monthlySpending[lastLastMonth],
          monthlySpending[lastMonth],
          monthlySpending[currentMonth],
          monthlySpending[nextMonth],
        ];
        const filteredIncome = [  
          monthlyIncome[lastLastMonth],
          monthlyIncome[lastMonth],
          monthlyIncome[currentMonth],
          monthlyIncome[nextMonth],
        ];
        const filteredNetBalance = [
          monthlyNetIncome[lastLastMonth],
          monthlyNetIncome[lastMonth],
          monthlyNetIncome[currentMonth],
          monthlyNetIncome[nextMonth],
        ];

        const structuredData : any = {
          netWorth: filteredNetWorth,
          monthlySpending: filteredSpending,
          monthlyIncome: filteredIncome,
          netBalance: filteredNetBalance,
          income,
          categories: {
            names: categories,
            amounts: categoryAmounts,
          },
          budget:budgets[budgets.length -1].amount,
          budgetlim:filteredSpending[2],
          maxnetworth : maxNetWorth,
          // lowestnetworth : lowestNetWorth,
          assets: {
            names: assetNames,
            prices: assetPrices,
          },
        };

        const stockNames : any = stocks.map(stock => stock.currency);
        const stockAmounts : any = stocks.map(stock => stock.amount.toFixed(2));
        const totalValue = stockAmounts.reduce((sum : any, amount : any) => sum + amount, 0);
        const stockDat : any = {names: stockNames, amounts: stockAmounts, totalValue}

        setData(structuredData);
        setStockData(stockDat);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user : any) => {
      if (user) {
        setUser(user);
        fetchData(user.uid);
      } else {
        setUser(null);
        setLoading(true);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);




  const incomeAndSpendingOptions = {
    animations: {
      enabled: true,
      easing: 'linear',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350,
      },
    },
    chart: {
      id: 'income-spending-chart',
      type: 'line',
      foreColor: '#fff',
      dropShadow: {
        enabled: true,
        top: 2,
        left: 2,
        blur: 5,
        opacity: 0.5,
        color: ['#FF4560', '#00E396', '#FFA500'],
      },
    },
    yaxis : {
      labels: {
        style: {
          colors: '#fff'
        },
        formatter: (value: number) => `$${value.toFixed(2)}`
      }
    },
    xaxis: {
      categories: ['Last-Last Month', 'Last Month', 'Current Month', 'Next Month'],
    },
    colors: ['#ff2617', '#00E396', '#ffea08'], // Spending, Income, Net Balance
    series: [
      {
        name: 'Spending',
        data: data.monthlySpending,
        dropShadow: { color: '#ff2617' },
      },
      {
        name: 'Income',
        data: data.monthlyIncome,
        dropShadow: { color: '#00E396' },
      },
      {
        name: 'Net Balance',
        data: data.netBalance,
        dropShadow: { color: '#ffea08' },
      },
    ],
    responsive: [
      {
        breakpoint: undefined,
        options: {
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  const netWorthOptions = {
    chart: {
      id: 'net-worth-chart',
      type: 'line',
      foreColor: '#fff',
      dropShadow: {
        enabled: true,
        blur: 5,
        left: 2,
        top: 2,
        opacity: 0.5,
        color: '#17ffae',
      },
    },
    yaxis : {
      labels: {
        style: {
          colors: '#fff'
        },
        formatter: (value: number) => `$${value.toFixed(2)}`
      }
    },
    xaxis: {
      categories: ['Last-Last Month', 'Last Month', 'Current Month', 'Next Month'],
    },
    colors: ['#17ffae'],
    responsive: [
      {
        breakpoint: undefined,
        options: {
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  const categoriesOptions = {
    chart: {
      id: 'categories-chart',
      type: 'donut',
      foreColor: '#fff'
    },
    labels: data.categories.names,
    plotOptions: {
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return val + "%";
        },
        dropShadow: {
          colors: [
            // "#04e494", "#0044b3", '#ff7514', '#17ffcd', '#ff1770', '#ffc117', '#ff3617'
            '#ff4326', '#ff2631', '#f74b20', '#f72064', '#f78d1b'
          ],
        }
      },
      pie: {
        expandOnClick: true,
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {show:true},
            color: "white"
          }
        },
      }
    },
    colors: [
      // "#04e494", "#0044b3", '#ff7514', '#17ffcd', '#ff1770', '#ffc117', '#ff3617'
      '#ff4326', '#ff2631', '#f74b20', '#f72064', '#f78d1b'
    ],
    responsive: [
      {
        breakpoint: undefined,
        options: {
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  const assetsOptions = {
    chart: {
      id: 'assets-chart',
      type: 'radar',
      foreColor: '#fff',
    },
    xaxis: {
      categories: data.assets.names,
    },
    dataLabels: {
      enabled: true,
      background: {
        enabled: true,
        borderRadius: 2,
      },
      formatter: (value: number) => `$${value.toFixed(2)}`
    },
    yaxis: {
      show: false,
    },
    colors: ['#FF4560'],
    responsive: [
      {
        breakpoint: undefined,
        options: {
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  const stockOptions = {
    chart: {
      id: 'stock-chart',
      type: 'bar',
      foreColor: '#fff',
    },
    xaxis: {
      categories: stockData.names,
    },
    colors: ['#f78d1b'],
    yaxis : {
      labels: {
        style: {
          colors: '#fff'
        },
        formatter: (value: number) => `$${value}`
      }
    },
    series: [
      {
        name: 'Stock Amount',
        data: stockData.amounts,
      },
    ],
    responsive: [
      {
        breakpoint: undefined,
        options: {
          chart: {
            width: '100%',
          },
        },
      },
    ],
  };

  if (!user) {
    return (
      <div className='w-screen h-screen justify-center items-center'>
        <Progress
          size="sm"
          isIndeterminate
          aria-label="Loading..."
          className="max-w-md w-screen"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-grow p-6 bg-transparent overflow-auto">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <br />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Income & Spending Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark">
            <Card className="bg-black text-black p-6 rounded-lg shadow-md w-full">
              <h2 className="text-lg text-white font-semibold text-center">Income & Spending</h2><br/>
              <h3 className="text-bold text-white text-center flex justify-around">
                <span>
                  Current Budget: ${data.budget}
                </span>
                <span>
                  Difference: ${data.budgetlim}
                </span>
              </h3>
              <div className="flex justify-center">
                {!loading ? (
                  data.monthlySpending.length > 0 ? (
                    <Chart
                      type="line"
                      options={incomeAndSpendingOptions}
                      series={[
                        { name: 'Spending', data: data.monthlySpending },
                        { name: 'Income', data: data.monthlyIncome },
                        { name: 'Net Balance', data: data.netBalance },
                      ]}
                      height={300}
                      width={400}
                    />
                  ) : (
                    <div className="text-white">Add transactions to view here!</div>
                  )
                ) : (
                  <div style={{ width: 400, height: 300 }}></div>
                )}
              </div>
            </Card>
          </Skeleton>

          {/* Net Worth Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark">
            <Card className="bg-black text-black p-6 rounded-lg shadow-md w-full">
              <h2 className="text-lg text-white font-semibold text-center">Net Worth</h2><br/>
              <h3 className="text-bold text-white text-center flex justify-around">
                {/* <span>
                  Lowest NetWorth: ${data.lowestNetWorth}
                </span> */}
                <span>
                  Highest NetWorth: ${data.maxnetworth}
                </span>
              </h3>
              <div className="flex justify-center">
                {!loading ? (
                  data.netWorth.length > 0 ? (
                    <Chart
                      type="line"
                      options={netWorthOptions}
                      series={[{ name: 'Net Worth', data: data.netWorth }]}
                      height={300}
                      width={400}
                    />
                  ) : (
                    <div className="text-white">Add transactions to view here!</div>
                  )
                ) : (
                  <div style={{ width: 400, height: 300 }}></div>
                )}
              </div>
            </Card>
          </Skeleton>

          {/* Top Categories Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark">
            <Card className="bg-black text-white p-6 rounded-lg shadow-md w-full">
              {/* <Spotlight className="absolute" fill="#de262c"/> */}
              <h2 className="text-lg font-semibold text-center">Top Categories</h2><br/>
              <div className="flex justify-center">
                {!loading ? (
                  data.categories.amounts.length > 0 ? (
                    <Chart
                      type='donut'
                      options={categoriesOptions}
                      series={data.categories.amounts}
                      height={300}
                      width={400}
                    />
                  ) : (
                    <div className="text-white">Add transactions to view here!</div>
                  )
                ) : (
                  <div style={{ width: 400, height: 300 }}></div>
                )}
              </div>
              {/* Display category names and amounts */}
              <div className="text-white mt-4">
                {data.categories.names.map((name, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{name}</span>
                    <span>${data.categories.amounts[index]}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Skeleton>

          {/* Recent Transactions Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark h-full">
            <Card className="bg-black text-white p-6 rounded-lg shadow-md w-full flex flex-col h-full">
              <h2 className="text-lg font-semibold text-center mb-4">Recent Transactions</h2><br/>
              <div className="overflow-y-auto flex-grow transact-card">
                {!loading ? (
                  <ul className="divide-y divide-gray-600 w-full">
                    {transactdata.map((transaction : any, index) => (
                      <li key={index} className="py-2 px-4">
                        <div className="flex justify-between">
                          <div className="flex-1 text-left">{transaction.name}</div>
                          <div className="flex-1 text-center">${transaction.amount}</div>
                          <div className="flex-1 text-right">{new Date(transaction.timestamp).toLocaleDateString()}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>Loading...</div>
                )}
              </div>
            </Card>
          </Skeleton>

          {/* Assets Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark">
            <Card className="bg-black text-white p-6 rounded-lg shadow-md w-full justify-center items-center">
              <h2 className="text-lg font-semibold text-center">Assets</h2><br/>
              <div className="flex justify-center">
                {!loading ? (
                  data.assets.prices.length > 0 ? (
                    <Chart
                      type="radar"
                      options={assetsOptions}
                      series={[{ name: 'Assets', data: data.assets.prices }]}
                      height={300}
                      width={400}
                    />
                  ) : (
                    <div
                      style={{ width: 400, height: 300 }}
                      className="text-white text-center h-90 w-full content-center"
                    >
                      Add assets to view here!
                    </div>
                  )
                ) : (
                  <div style={{ width: 400, height: 300 }}></div>
                )}
              </div>
            </Card>
          </Skeleton>

          {/* Stocks Card */}
          <Skeleton isLoaded={!loading} className="rounded-lg dark">
            <Card className="bg-black text-black p-6 rounded-lg shadow-md w-full justify-center items-center">
              <h2 className="text-lg text-white font-semibold text-center">Stocks</h2><br/>
              <div className="flex justify-center">
                {!loading ? (
                  stockData.names.length > 0 ? (
                    <Chart height={300} width={400} options={stockOptions} series={stockOptions.series} type="bar" />
                  ) : (
                    <div
                      style={{ width: 400, height: 300 }}
                      className="text-white text-center h-90 w-full content-center"
                    >
                      Add crypto to view here!
                    </div>
                  )
                ) : (
                  <div style={{ width: 400, height: 300 }}></div>
                )}
              </div>
            </Card>
          </Skeleton>
        </div>
      </div>
    </div>
  );
}
