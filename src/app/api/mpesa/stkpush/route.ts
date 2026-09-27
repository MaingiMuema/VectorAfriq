import { NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, phoneNumber } = await req.json();

        if (!amount || !phoneNumber) {
            return NextResponse.json(
                { error: 'Amount and phone number are required' },
                { status: 400 }
            );
        }

        if (amount < 1) {
            return NextResponse.json(
                { error: 'Amount must be at least 1 KES' },
                { status: 400 }
            );
        }

        // Ensure wallet exists
        const userId = session.user.id;
        let [wallet] = await query<any>('SELECT * FROM wallet WHERE userId = ?', [userId]);

        if (!wallet) {
            const walletId = uuidv4();
            await query(
                'INSERT INTO wallet (id, userId, balance, updatedAt) VALUES (?, ?, 0, NOW())',
                [walletId, userId]
            );
            [wallet] = await query<any>('SELECT * FROM wallet WHERE id = ?', [walletId]);
        }

        const result = await initiateSTKPush(phoneNumber, Number(amount));

        // Save pending transaction
        // result contains CheckoutRequestID
        const checkoutRequestId = result.CheckoutRequestID;

        await query(
            `INSERT INTO wallet_transaction (id, walletId, type, amount, description, status, reference, createdAt, updatedAt)
       VALUES (?, ?, 'CREDIT', ?, 'M-Pesa Top Up', 'PENDING', ?, NOW(), NOW())`,
            [uuidv4(), wallet.id, amount, checkoutRequestId]
        );

        return NextResponse.json({
            success: true,
            message: 'STK Push initiated successfully',
            data: result
        });
    } catch (error: any) {
        console.error('STK Push Error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to initiate M-Pesa payment',
                details: error.response?.data || error.message
            },
            { status: 500 }
        );
    }
}
