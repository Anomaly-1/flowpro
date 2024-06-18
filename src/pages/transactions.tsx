import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { addDoc, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Input, Button, Card, CardHeader, CardBody } from '@nextui-org/react';
import { DatePicker } from '@nextui-org/date-picker';
import moment from 'moment';
import '../app/globals.css';

export default function Transactions() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app)

    const [transaction, setTransaction] = useState({ type: 'add', category: '', name: '', amount: '', date: '' });
    const [budget, setBudget] = useState('');
    const [asset, setAsset] = useState({ name: '', price: '', date: '' });
    const [loading, setLoading] = useState({ transaction: false, budget: false, asset: false });

    const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTransaction(prev => ({ ...prev, [name]: value }));
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBudget(e.target.value);
    };

    const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAsset(prev => ({ ...prev, [name]: value }));
    };

    const auth = getAuth();

    const saveTransaction = async () => {
        setLoading(prev => ({ ...prev, transaction: true }));
        const user = auth.currentUser;
        if (user) {
            try {
                await addDoc(collection(db, `users/${user.uid}/transactions`), {
                    userId: user.uid,
                    type: transaction.type,
                    category: transaction.category,
                    name: transaction.name,
                    amount: parseFloat(transaction.amount),
                    timestamp: transaction.date,
                });
                alert('Transaction saved successfully!');
                setTransaction({ type: 'add', category: '', name: '', amount: '', date: '' });
            } catch (e) {
                console.error('Error adding document: ', e);
            } finally {
                setLoading(prev => ({ ...prev, transaction: false }));
            }
        } else {
            alert('No user is signed in');
        }
    };

    const saveBudget = async () => {
        setLoading(prev => ({ ...prev, budget: true }));
        const user = auth.currentUser;
        if (user) {
            try {
                await addDoc(collection(db, `users/${user.uid}/budgets`), {
                    userId: user.uid,
                    amount: parseFloat(budget)
                });
                alert('Budget saved successfully!');
                setBudget('');
            } catch (e) {
                console.error('Error adding document: ', e);
            } finally {
                setLoading(prev => ({ ...prev, budget: false }));
            }
        } else {
            alert('No user is signed in');
        }
    };

    const saveAsset = async () => {
        setLoading(prev => ({ ...prev, asset: true }));
        const user = auth.currentUser;
        if (user) {
            try {
                await addDoc(collection(db, `users/${user.uid}/assets`), {
                    userId: user.uid,
                    name: asset.name,
                    price: parseFloat(asset.price),
                    timestamp: asset.date,
                });
                alert('Asset saved successfully!');
                setAsset({ name: '', price: '', date: '' });
            } catch (e) {
                console.error('Error adding document: ', e);
            } finally {
                setLoading(prev => ({ ...prev, asset: false }));
            }
        } else {
            alert('No user is signed in');
        }
    };

    const handleTransactionDateChange = (date: any) => {
        setTransaction(prev => ({ ...prev, date: date.month + "/" + date.day + "/" + date.year }));
    };

    const handleAssetDateChange = (date: any) => {
        setAsset(prev => ({ ...prev, date: date.month + "/" + date.day + "/" + date.year }));
    };

    const isTransactionDisabled = !transaction.category || !transaction.name || !transaction.amount || !transaction.date;
    const isBudgetDisabled = !budget;
    const isAssetDisabled = !asset.name || !asset.price || !asset.date;

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-grow p-6 overflow-auto text-white">
                <h1 className="text-3xl font-bold mb-6 text-center">Transactions</h1>
                <div className="flex gap-4 justify-start">
                    <div className="w-full sm:w-1/3">
                        <Card className="dark bg-black">
                            <CardHeader className="text-center">
                                <h2 className="mb-4 font-bold text-white">Add/Subtract Money</h2>
                            </CardHeader>
                            <CardBody>
                                <select
                                    name="type"
                                    value={transaction.type}
                                    onChange={handleTransactionChange}
                                    className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
                                    aria-label="Transaction Type"
                                >
                                    <option value="add">Add Money</option>
                                    <option value="subtract">Subtract Money</option>
                                </select>
                                <Input
                                    name="category"
                                    placeholder="Category"
                                    value={transaction.category}
                                    onChange={handleTransactionChange}
                                    fullWidth
                                    variant="underlined"
                                    color="primary"
                                    className="mb-4"
                                    aria-label="Category"
                                />
                                <Input
                                    name="name"
                                    placeholder="Name"
                                    value={transaction.name}
                                    onChange={handleTransactionChange}
                                    fullWidth
                                    variant="underlined"
                                    color="primary"
                                    className="mb-4"
                                    aria-label="Name"
                                />
                                <Input
                                    type="number"
                                    name="amount"
                                    placeholder="Amount"
                                    value={transaction.amount}
                                    onChange={handleTransactionChange}
                                    fullWidth
                                    variant="underlined"
                                    color="primary"
                                    className="mb-4"
                                    aria-label="Amount"
                                />
                                <div className="mb-4">
                                    <DatePicker
                                        label="Transaction Date"
                                        onChange={handleTransactionDateChange}
                                        className="w-full p-2 bg-gray-700 text-white rounded"
                                    />
                                </div>
                                <Button
                                    onClick={saveTransaction}
                                    className="w-full"
                                    color="success"
                                    isDisabled={isTransactionDisabled}
                                    isLoading={loading.transaction}
                                >
                                    Save Transaction
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="w-full sm:w-2/3 flex gap-4">
                        <div className="w-full sm:w-1/2">
                            <Card className="dark bg-black">
                                <CardHeader className="text-center">
                                    <h2 className="mb-4 font-bold text-white">Set Budget</h2>
                                </CardHeader>
                                <CardBody>
                                    <Input
                                        type="number"
                                        placeholder="Budget Amount"
                                        value={budget}
                                        onChange={handleBudgetChange}
                                        fullWidth
                                        variant="underlined"
                                        color="primary"
                                        className="mb-4"
                                        aria-label="Budget Amount"
                                    />
                                    <Button
                                        onClick={saveBudget}
                                        className="w-full"
                                        color="primary"
                                        isDisabled={isBudgetDisabled}
                                        isLoading={loading.budget}
                                    >
                                        Save Budget
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <Card className="dark bg-black">
                                <CardHeader className="text-center">
                                    <h2 className="mb-4 font-bold text-white">Add Asset</h2>
                                </CardHeader>
                                <CardBody>
                                    <Input
                                        name="name"
                                        placeholder="Asset Name"
                                        value={asset.name}
                                        onChange={handleAssetChange}
                                        fullWidth
                                        variant="underlined"
                                        color="primary"
                                        className="mb-4"
                                        aria-label="Asset Name"
                                    />
                                    <Input
                                        type="number"
                                        name="price"
                                        placeholder="Asset Price"
                                        value={asset.price}
                                        onChange={handleAssetChange}
                                        fullWidth
                                        variant="underlined"
                                        color="primary"
                                        className="mb-4"
                                        aria-label="Asset Price"
                                    />
                                    <div className="mb-4">
                                        <DatePicker
                                            label="Asset Date"
                                            onChange={handleAssetDateChange}
                                            className="w-full p-2 bg-gray-700 text-white rounded"
                                        />
                                    </div>
                                    <Button
                                        onClick={saveAsset}
                                        className="w-full"
                                        color="warning"
                                        isDisabled={isAssetDisabled}
                                        isLoading={loading.asset}
                                    >
                                        Save Asset
                                    </Button>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
