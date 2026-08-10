import React, { useState } from 'react'
import Modal from '@/components/ui/modal'

export default function PaymentModal({ open, onClose, onConfirm, defaultAmount = 0, title = 'Record Payment' }: { open: boolean; onClose: () => void; onConfirm: (amount: number) => void; defaultAmount?: number; title?: string }) {
    const [amount, setAmount] = useState(defaultAmount)
    const [method, setMethod] = useState('Bank Transfer')

    const handleConfirm = () => {
        onConfirm(Number(amount) || 0)
        onClose()
    }

    return (
        <Modal open={open} onClose={onClose} title={title} footer={<>
            <button type="button" onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
            <button type="button" onClick={handleConfirm} className="btn btn-primary">Post Payment</button>
        </>}>
            <div style={{ display: 'grid', gap: 10 }}>
                <label>
                    Amount
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                <label>
                    Payment Method
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option>Bank Transfer</option>
                        <option>Cash</option>
                        <option>POS</option>
                        <option>Mobile Money</option>
                    </select>
                </label>
            </div>
        </Modal>
    )
}
