import React from 'react';
import { FiMail } from 'react-icons/fi';
import WebmailClient from './WebmailClient';

export default function WebmailAccessPage() {
    // Read directly from .env (Not exposed as NEXT_PUBLIC_ to UI source files)
    const passwords = {
        'info@vectorafriqproperties.co.ke': process.env.WEBMAIL_INFO_PWD || '',
        'sales@vectorafriqproperties.co.ke': process.env.WEBMAIL_SALES_PWD || '',
        'anne@vectorafriqproperties.co.ke': process.env.WEBMAIL_ANNE_PWD || '',
        'vincent@vectorafriqproperties.co.ke': process.env.WEBMAIL_VINCENT_PWD || '',
        'kevin@vectorafriqproperties.co.ke': process.env.WEBMAIL_KEVIN_PWD || '',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-10 sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-[#468AD1]">
                            <FiMail className="w-6 h-6" />
                        </div>
                        Team Webmail Access
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Secure, one-click single sign-on access to administrative email accounts via cPanel.
                    </p>
                </div>
            </div>

            <WebmailClient passwords={passwords} />
        </div>
    );
}
