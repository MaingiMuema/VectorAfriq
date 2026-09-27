'use client';

import { useState } from 'react';
import { FiX, FiSmartphone, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import axios from 'axios';

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate phone number (basic validation)
            if (!phoneNumber.match(/^(?:254|\+254|0)?7\d{8}$/)) {
                throw new Error('Please enter a valid Safaricom phone number');
            }

            if (!amount || Number(amount) <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const response = await axios.post('/api/mpesa/stkpush', {
                phoneNumber,
                amount: Number(amount),
            });

            if (response.data.success) {
                toast.success('STK Push initiated! check your phone to complete payment.');
                onClose();
                // Reset form
                setPhoneNumber('');
                setAmount('');
            } else {
                toast.error(response.data.error || 'Failed to initiate payment');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error(error.message || error.response?.data?.error || 'Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-[#468AD1] px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Top Up Wallet</h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-green-600 text-xs">M-PESA</span>
                        </div>
                        <p className="text-sm text-green-800">
                            Securely top up your wallet using M-Pesa. The amount will be reflected immediately after payment validation.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                M-Pesa Phone Number
                            </label>
                            <div className="relative">
                                <FiSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="2547XXXXXXXX"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="pl-10 focus-visible:ring-[#468AD1]"
                                    required
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Format: 2547XXXXXXXX or 07XXXXXXXX</p>
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (KES)
                            </label>
                            <div className="relative">
                                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Enter amount"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-10 focus-visible:ring-[#468AD1]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full bg-[#468AD1] hover:bg-[#2F6FAE] text-white"
                                disabled={loading}
                            >
                                {loading ? 'Initiating Payment...' : 'Pay with M-Pesa'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
