import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { Body } = body;

        if (!Body || !Body.stkCallback) {
            console.error('Invalid M-Pesa callback body:', body);
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { stkCallback } = Body;
        const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID } = stkCallback;

        console.log('M-Pesa Callback Received:', JSON.stringify(body, null, 2));

        // Find the pending transaction
        const [transaction] = await query<any>(
            "SELECT * FROM wallet_transaction WHERE reference = ? AND status = 'PENDING'",
            [CheckoutRequestID]
        );

        if (!transaction) {
            console.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
            // Return 200 anyway to stop M-Pesa from retrying
            return NextResponse.json({ received: true });
        }

        if (ResultCode === 0) {
            // Payment Successful
            const amountItem = CallbackMetadata.Item.find((item: any) => item.Name === 'Amount');
            const mpesaReceiptItem = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
            const phoneNumberItem = CallbackMetadata.Item.find((item: any) => item.Name === 'PhoneNumber');

            const amount = amountItem?.Value;
            const receiptNumber = mpesaReceiptItem?.Value;
            // const phoneNumber = phoneNumberItem?.Value; 

            // Update Transaction to COMPLETED
            await query(
                "UPDATE wallet_transaction SET status = 'COMPLETED', reference = ?, updatedAt = NOW() WHERE id = ?",
                [receiptNumber, transaction.id] // Note: Replacing CheckoutRequestID with ReceiptNumber in reference field
            );

            // Update Wallet Balance
            await query(
                "UPDATE wallet SET balance = balance + ?, updatedAt = NOW() WHERE id = ?",
                [amount, transaction.walletId]
            );

            console.log(`Payment successful: ${receiptNumber} - KES ${amount} for transaction ${transaction.id}`);

        } else {
            // Payment Failed or Cancelled
            console.warn(`Payment failed: ${ResultDesc} (Code: ${ResultCode})`);

            await query(
                "UPDATE wallet_transaction SET status = 'FAILED', description = ?, updatedAt = NOW() WHERE id = ?",
                [`Failed: ${ResultDesc}`, transaction.id]
            );
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing M-Pesa callback:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
