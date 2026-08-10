import React, { useState } from 'react'
import Modal from '@/components/ui/modal'
import { makeID } from '@/lib/utils'

export default function AddLoanModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (loan: any) => void }) {
    const [lender, setLender] = useState('GTBank')
    const [amount, setAmount] = useState(0)
    const [term, setTerm] = useState(12)

    const handleCreate = () => {
        const loan = { id: makeID('LN'), lender, balance: Number(amount) || 0, term }
        onCreate(loan)
        onClose()
    }

    return (
        <Modal open={open} onClose={onClose} title="Add New Loan" footer={<>
            <button type="button" onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
            <button type="button" onClick={handleCreate} className="btn btn-primary">Create Loan</button>
        </>}>
            <div style={{ display: 'grid', gap: 10 }}>
                <label>
                    Lender
                    <input value={lender} onChange={(e) => setLender(e.target.value)} />
                </label>
                <label>
                    Amount
                    <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </label>
                <label>
                    Term (months)
                    <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} />
                </label>
            </div>
        </Modal>
    )
}
