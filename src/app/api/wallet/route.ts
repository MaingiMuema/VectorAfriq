import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch wallet, lazy create if doesn't exist
        let [wallet] = await query<any>('SELECT * FROM wallet WHERE userId = ?', [userId]);

        if (!wallet) {
            const walletId = uuidv4();
            await query(
                'INSERT INTO wallet (id, userId, balance, updatedAt) VALUES (?, ?, 0, NOW())',
                [walletId, userId]
            );
            [wallet] = await query<any>('SELECT * FROM wallet WHERE id = ?', [walletId]);
        }

        // Fetch transactions
        const transactions = await query<any>(
            'SELECT * FROM wallet_transaction WHERE walletId = ? ORDER BY createdAt DESC',
            [wallet.id]
        );

        return NextResponse.json({
            balance: wallet.balance,
            transactions: transactions.map(t => ({
                id: t.id,
                type: t.type.toLowerCase(),
                amount: t.amount,
                description: t.description,
                status: t.status.toLowerCase(),
                date: t.createdAt,
                reference: t.reference || 'N/A'
            }))
        });
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
