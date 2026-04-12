'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, FileText, Download } from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/user/transactions')
        const data = await res.json()
        if (data.transactions) {
          setTransactions(data.transactions)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const totalDonated = transactions
    .filter((t: any) => t.type === 'Donation')
    .reduce((sum: number, t: any) => sum + t.amountINR, 0)
    
  const totalClaimed = transactions
    .filter((t: any) => t.type === 'Claim')
    .reduce((sum: number, t: any) => sum + t.amountINR, 0)

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-bold font-[Syne] text-[#F1F5F9] mb-8">
          Transaction History
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Total Donated</p>
              <h2 className="text-3xl font-bold font-[Syne] text-[#F1F5F9]">₹{totalDonated.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center text-[#EF4444]">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-1">Funds Claimed</p>
              <h2 className="text-3xl font-bold font-[Syne] text-[#6EE7B7]">₹{totalClaimed.toLocaleString()}</h2>
            </div>
            <div className="w-12 h-12 bg-[#6EE7B7]/10 rounded-xl flex items-center justify-center text-[#6EE7B7]">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0A0A0F]/50">
            <h2 className="font-bold text-[#F1F5F9] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#64748B]" /> Ledger
            </h2>
            <button className="text-sm font-bold text-[#6EE7B7] hover:text-[#52af35] flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0F]/30 text-[#64748B] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Campaign</th>
                  <th className="p-4 font-bold">Algorand TX ID</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748B]">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748B]">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-[#1E1E2E]/50 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                          tx.type === 'Donation' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 
                          tx.type === 'Refund' ? 'bg-yellow-500/10 text-yellow-500' : 
                          'bg-[#6EE7B7]/10 text-[#6EE7B7]'
                        }`}>
                          {tx.type === 'Donation' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type}
                        </span>
                        {tx.type === 'Donation' && tx.campaign?.status === 'cancelled' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/30 text-yellow-500 line-through decoration-yellow-500/50">
                            CANCELED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[#F1F5F9] font-medium text-sm">
                        {tx.campaign?.title || 'Unknown Campaign'}
                      </td>
                      <td className="p-4">
                        <a 
                          href={`https://testnet.algoexplorer.io/tx/${tx.txId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#818CF8] font-[JetBrains_Mono] text-xs hover:underline"
                        >
                          {tx.txId.substring(0, 16)}...
                        </a>
                      </td>
                      <td className="p-4 text-[#64748B] text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 flex flex-col items-end">
                        <span className={`font-bold text-sm ${tx.type === 'Donation' ? 'text-[#EF4444]' : 'text-[#6EE7B7]'}`}>
                          {tx.type === 'Donation' ? '-' : '+'}₹{Math.floor(tx.amountINR).toLocaleString()}
                        </span>
                        <span className="text-xs text-[#818CF8] font-[JetBrains_Mono]">
                          {tx.amountALGO.toFixed(2)} A
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  )
}
