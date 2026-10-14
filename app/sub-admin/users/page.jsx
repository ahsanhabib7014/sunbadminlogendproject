'use client';

import { useState } from 'react';

export default function SubAdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ইউজার সার্চ করার ফাংশন
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.users.length === 0) {
          setMessage('কোনো ইউজার পাওয়া যায়নি।');
        }
      } else {
        setMessage(data.message || 'ডেটা লোড করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setMessage('সার্ভার ত্রুটি ঘটেছে।');
    }
    setLoading(false);
  };

  // ইউজার এডিট মোড ওপেন করা
  const openEditModal = (user) => {
    setSelectedUser({
      userId: user.uid,
      balance: user.balance || 0,
      turnover: user.turnover || 0,
      isBlocked: user.isBlocked || false,
      customCommission: user.customCommission ?? ''
    });
    setIsModalOpen(true);
  };

  // ইউজার আপডেট করার ফাংশন (PATCH)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsModalOpen(false);
        setUsers(users.map(u => u.uid === selectedUser.userId ? { ...u, ...selectedUser } : u));
      } else {
        alert(data.message || 'আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি ঘটেছে।');
    }
  };

  // ইউজার ডিলিট করার ফাংশন
  const handleDeleteUser = async (userId) => {
    if (!confirm('আপনি কি নিশ্চিত এই ইউজারটি ডিলিট করতে চান?')) return;

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setUsers(users.filter(u => u.uid !== userId));
      } else {
        alert(data.message || 'ডিলিট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি ঘটেছে।');
    }
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-400">👥 সাব-অ্যাডমিন ইউজার ম্যানেজমেন্ট</h1>
        <p className="text-sm text-slate-400 mt-1">ইউজার খুঁজুন, ব্যালেন্স, টার্নওভার ও স্ট্যাটাস পরিবর্তন করুন</p>
      </div>

      {/* সার্চ বক্স */}
      <div className="bg-[#0b132b] border border-slate-800 p-5 rounded-2xl shadow-xl mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="ইউজার ফোন নম্বর, UID দিয়ে খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button 
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-sm font-semibold shadow-lg shadow-emerald-900/20"
          >
            🔍 খুঁজুন
          </button>
        </form>
      </div>

      {message && <div className="p-4 mb-6 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-center">{message}</div>}

      {/* ইউজার লিস্ট টেবিল */}
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#070b19] z-10">
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4">UID</th>
                <th className="p-4">ফোন নম্বর</th>
                <th className="p-4">ব্যালেন্স</th>
                <th className="p-4">টার্নওভার</th>
                <th className="p-4">স্ট্যাটাস</th>
                <th className="p-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">ইউজার ডেটা লোড হচ্ছে...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">কোনো ইউজার ডেটা পাওয়া যায়নি। দয়া করে সার্চ করুন।</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id || user.uid} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-xs text-emerald-400">{user.uid}</td>
                    <td className="p-4 font-semibold">{user.phone}</td>
                    <td className="p-4 text-slate-300">৳ {user.balance || 0}</td>
                    <td className="p-4 text-slate-300">৳ {user.turnover || 0}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        user.isBlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {user.isBlocked ? 'ব্লকড' : 'অ্যাক্টিভ'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        এডিট
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.uid)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        ডিলিট
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* এডিট মডাল */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">ইউজার তথ্য আপডেট ({selectedUser.userId})</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ব্যালেন্স</label>
                <input 
                  type="number" 
                  value={selectedUser.balance}
                  onChange={(e) => setSelectedUser({ ...selectedUser, balance: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">টার্নওভার</label>
                <input 
                  type="number" 
                  value={selectedUser.turnover}
                  onChange={(e) => setSelectedUser({ ...selectedUser, turnover: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">কাস্টম কমিশন (%)</label>
                <input 
                  type="number" 
                  value={selectedUser.customCommission}
                  onChange={(e) => setSelectedUser({ ...selectedUser, customCommission: e.target.value })}
                  placeholder="খালি রাখতে পারেন"
                  className="w-full px-4 py-2 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isBlocked"
                  checked={selectedUser.isBlocked}
                  onChange={(e) => setSelectedUser({ ...selectedUser, isBlocked: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500"
                />
                <label htmlFor="isBlocked" className="text-sm text-slate-300">ইউজার ব্লক করুন</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  বাতিল
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}