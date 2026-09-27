'use client';

import React, { useRef, useState } from 'react';
import { FiUnlock, FiExternalLink, FiUser, FiBriefcase, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion } from 'framer-motion';

const getAccountConfig = (email: string) => {
    switch (email) {
        case 'info@vectorafriqproperties.co.ke':
            return { name: 'General Inquiries', role: 'Information', icon: FiInfo, color: 'from-blue-500 to-cyan-400' };
        case 'sales@vectorafriqproperties.co.ke':
            return { name: 'Sales Department', role: 'Sales', icon: FiBriefcase, color: 'from-green-500 to-emerald-400' };
        case 'anne@vectorafriqproperties.co.ke':
            return { name: 'Anne', role: 'Staff Account', icon: FiUser, color: 'from-purple-500 to-fuchsia-400' };
        case 'vincent@vectorafriqproperties.co.ke':
            return { name: 'Vincent', role: 'Staff Account', icon: FiUser, color: 'from-orange-500 to-amber-400' };
        case 'kevin@vectorafriqproperties.co.ke':
            return { name: 'Kevin', role: 'Staff Account', icon: FiUser, color: 'from-rose-500 to-red-400' };
        default:
            return { name: 'Unknown', role: 'Unknown', icon: FiUser, color: 'from-gray-500 to-gray-400' };
    }
}

export default function WebmailClient({ passwords }: { passwords: Record<string, string> }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedPass, setSelectedPass] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

    const togglePasswordVisibility = (email: string) => {
        setVisiblePasswords(prev => ({ ...prev, [email]: !prev[email] }));
    };

    const emailAccounts = Object.keys(passwords).map(email => ({
        email,
        password: passwords[email],
        ...getAccountConfig(email)
    }));

    const handleLogin = (email: string, pass: string) => {
        setIsLoggingIn(email);
        setSelectedUser(email);
        setSelectedPass(pass);

        // Give state a tiny bit of time to update before form submission
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.submit();
            }
            // Reset loading state after a few seconds in case they navigate back
            setTimeout(() => setIsLoggingIn(null), 3000);
        }, 100);
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {emailAccounts.map((account, index) => {
                    const Icon = account.icon;
                    return (
                        <motion.div
                            key={account.email}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group"
                        >
                            <div className={`h-2 w-full bg-gradient-to-r ${account.color}`} />
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#468AD1] mb-1 flex items-center gap-1.5">
                                            <Icon className="w-4 h-4" />
                                            {account.role}
                                        </p>
                                        <p className="text-xl font-bold text-gray-900 truncate">
                                            {account.name}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate mt-1">
                                            {account.email}
                                        </p>
                                    </div>
                                    <div className="ml-4 shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors duration-300">
                                            <FiUnlock className="w-6 h-6 text-gray-400 group-hover:text-[#468AD1]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Password row with show/hide toggle */}
                                <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                    <span className="text-xs text-gray-400 shrink-0">PWD</span>
                                    <code className="text-xs text-gray-600 flex-1 truncate font-mono">
                                        {visiblePasswords[account.email]
                                            ? account.password
                                            : '••••••••••••'}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(account.email)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                                        title={visiblePasswords[account.email] ? 'Hide password' : 'Show password'}
                                    >
                                        {visiblePasswords[account.email]
                                            ? <FiEyeOff className="w-3.5 h-3.5" />
                                            : <FiEye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => handleLogin(account.email, account.password)}
                                        disabled={isLoggingIn === account.email || !account.password}
                                        className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-[#468AD1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1] transition-colors duration-300 disabled:opacity-70 gap-2"
                                    >
                                        {isLoggingIn === account.email ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Authenticating...
                                            </>
                                        ) : (
                                            <>
                                                Access Inbox
                                                <FiExternalLink className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Hidden form to submit credentials to cPanel Webmail safely */}
            <form
                ref={formRef}
                action="https://server126.web-hosting.com:2096/login/"
                method="POST"
                target="_blank"
                style={{ display: 'none' }}
            >
                <input type="hidden" name="user" value={selectedUser} />
                <input type="hidden" name="pass" value={selectedPass} />
                <input type="hidden" name="goto_uri" value="/3rdparty/roundcube/?_task=mail&amp;_mbox=INBOX" />
            </form>
        </>
    );
}
