import React, { useState } from 'react'
import Modal from '@/components/ui/modal'
import { makeID } from '@/lib/utils'

export default function ManualJournalModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (entry: any) => void }) {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [description, setDescription] = useState('')
    const [account, setAccount] = useState('Manual Journal')

    const handleCreate = () => {
        const entry = { id: makeID('MJ'), entryDate: date, description, sourceModule: 'MANUAL', status: 'POSTED' }
        onCreate(entry)
        onClose()
    }

    return (
        <Modal open={open} onClose={onClose} title="Create Manual Journal" footer={<>
            <button type="button" onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
            <button type="button" onClick={handleCreate} className="btn btn-primary">Create</button>
        </>}>
            <div style={{ display: 'grid', gap: 10 }}>
                <label>
                    Date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <label>
                    Account
                    <input value={account} onChange={(e) => setAccount(e.target.value)} />
                </label>
                <label>
                    Description
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
            </div>
        </Modal>
    )
}
