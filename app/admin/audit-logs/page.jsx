// // 'use client';

// // import { useState, useEffect } from 'react';

// // export default function AuditLogsPage() {
// //   const [logs, setLogs] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [message, setMessage] = useState('');

// //   useEffect(() => {
// //     fetchLogs();
// //   }, []);

// //   const fetchLogs = async () => {
// //     try {
// //       const res = await fetch('/api/admin/audit-logs');
// //       const data = await res.json();
// //       if (data.success) {
// //         setLogs(data.logs);
// //       } else {
// //         setMessage(data.message);
// //       }
// //     } catch (err) {
// //       setMessage('লগ লোড করতে গিয়ে সমস্যা হয়েছে');
// //     }
// //     setLoading(false);
// //   };

// //   return (
// //     <div className="p-6 text-white max-w-6xl mx-auto font-sans">
// //       <h1 className="text-2xl font-bold mb-6 text-emerald-400">সিস্টেম অডিট লগ (অ্যাক্টিভিটি ট্র্যাকিং)</h1>

// //       {message && <div className="p-3 mb-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">{message}</div>}

// //       {loading ? (
// //         <p className="text-slate-400">লগ লোড হচ্ছে...</p>
// //       ) : logs.length === 0 ? (
// //         <p className="text-slate-400">এখনো কোনো অডিট লগ রেকর্ড করা হয়নি।</p>
// //       ) : (
// //         <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
// //           <div className="overflow-x-auto">
// //             <table className="w-full text-left border-collapse">
// //               <thead>
// //                 <tr className="bg-[#070b19] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
// //                   <th className="p-4">সময়</th>
// //                   <th className="p-4">অ্যাডমিন (ফোন)</th>
// //                   <th className="p-4">অ্যাকশন টাইপ</th>
// //                   <th className="p-4">টার্গেট ইউজার</th>
// //                   <th className="p-4">বিস্তারিত বিবরণ</th>
// //                   <th className="p-4">আইপি অ্যাড্রেস</th>
// //                 </tr>
// //               </thead>
// //               <tbody className="divide-y divide-slate-800 text-sm">
// //                 {logs.map((log) => (
// //                   <tr key={log._id} className="hover:bg-slate-800/40 transition">
// //                     <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
// //                       {new Date(log.createdAt).toLocaleString('bn-BD')}
// //                     </td>
// //                     <td className="p-4 font-semibold text-emerald-400">{log.adminPhone}</td>
// //                     <td className="p-4">
// //                       <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
// //                         {log.action}
// //                       </span>
// //                     </td>
// //                     <td className="p-4 text-slate-300 font-mono text-xs">{log.targetUser || 'N/A'}</td>
// //                     <td className="p-4 text-slate-300 text-xs">{log.details}</td>
// //                     <td className="p-4 text-slate-400 font-mono text-xs">{log.ipAddress}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // ///////////////////////////////////////////
// 'use client';

// import { useState, useEffect } from 'react';

// export default function AuditLogsPage() {
//   const [data, setData] = useState({ logs: [], groupedLogs: {} });
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
  
//   const [search, setSearch] = useState('');
//   const [selectedGroup, setSelectedGroup] = useState('all');

//   const allPermissions = [
//     { key: 'all', label: 'সকল লগ' },
//     { key: 'dashboard', label: 'ড্যাশবোর্ড' },
//     { key: 'tracking', label: 'ট্র্যাকিং' },
//     { key: 'users', label: 'ইউজার' },
//     { key: 'deposits', label: 'ডিপোজিট' },
//     { key: 'withdraws', label: 'উইথড্র' },
//     { key: 'referrals', label: 'রেফারেল' },
//     { key: 'payments', label: 'পেমেন্ট' },
//     { key: 'methods', label: 'মেথডস' },
//     { key: 'exchange_rate', label: 'Exchange Rate' },
//     { key: 'nowpayments', label: 'NowPayments' },
//     { key: 'auto_crypto', label: 'Auto Crypto' },
//     { key: 'bonus_settings', label: 'বোনাস সেটিংস' },
//     { key: 'bonus_history', label: 'বোনাস ইতিহাস' },
//     { key: 'others', label: 'অন্যান্য' },
//   ];

//   useEffect(() => {
//     fetchLogs();
//   }, []);

//   const fetchLogs = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch('/api/admin/audit-logs');
//       const result = await res.json();
//       if (result.success) {
//         setData(result);
//       } else {
//         setMessage(result.message);
//       }
//     } catch (err) {
//       setMessage('লগ লোড করতে গিয়ে সমস্যা হয়েছে');
//     }
//     setLoading(false);
//   };

//   const getFilteredLogs = () => {
//     let list = [];
//     if (selectedGroup === 'all') {
//       list = data.logs || [];
//     } else {
//       list = data.groupedLogs?.[selectedGroup] || [];
//     }

//     if (!search.trim()) return list;

//     const term = search.toLowerCase();
//     return list.filter(log => 
//       log.adminPhone?.toLowerCase().includes(term) ||
//       log.details?.toLowerCase().includes(term) ||
//       log.action?.toLowerCase().includes(term) ||
//       log.ipAddress?.toLowerCase().includes(term) ||
//       log.targetUser?.toLowerCase().includes(term)
//     );
//   };

//   const currentLogs = getFilteredLogs();

//   return (
//     <div className="p-6 text-white max-w-7xl mx-auto font-sans">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-emerald-400">🛡️ সাব-অ্যাডমিন অডিট লগ কন্ট্রোল প্যানেল</h1>
//           <p className="text-sm text-slate-400 mt-1">পারমিশন অনুযায়ী সাব-অ্যাডমিনদের কার্যক্রমের সুনির্দিষ্ট ট্র্যাকিং</p>
//         </div>
//         <button 
//           onClick={fetchLogs}
//           className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-sm font-semibold shadow-lg shadow-emerald-900/20 flex items-center gap-2"
//         >
//           🔄 রিফ্রেশ করুন
//         </button>
//       </div>

//       {message && <div className="p-4 mb-6 bg-red-950/80 border border-red-800 rounded-xl text-red-200">{message}</div>}

//       <div className="bg-[#0b132b] border border-slate-800 p-5 rounded-2xl shadow-xl mb-6 flex flex-col gap-4">
//         <div className="w-full md:w-1/3">
//           <input 
//             type="text" 
//             placeholder="অ্যাডমিন ফোন, বিবরণ, বা আইপি দিয়ে খুঁজুন..." 
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full px-4 py-2.5 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
//           />
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {allPermissions.map((cat) => {
//             const count = cat.key === 'all' ? (data.logs?.length || 0) : (data.groupedLogs?.[cat.key]?.length || 0);
//             return (
//               <button
//                 key={cat.key}
//                 onClick={() => setSelectedGroup(cat.key)}
//                 className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
//                   selectedGroup === cat.key
//                     ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
//                     : 'bg-[#070b19] text-slate-300 border border-slate-800 hover:bg-slate-800'
//                 }`}
//               >
//                 <span>{cat.label}</span>
//                 <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
//                   selectedGroup === cat.key ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
//                 }`}>
//                   {count}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {loading ? (
//         <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-xl">
//           অডিট লগ লোড হচ্ছে...
//         </div>
//       ) : currentLogs.length === 0 ? (
//         <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-xl">
//           এই ক্যাটাগরিতে কোনো অডিট লগ পাওয়া যায়নি।
//         </div>
//       ) : (
//         <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-[#070b19] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
//                   <th className="p-4">সময়</th>
//                   <th className="p-4">অ্যাডমিন (ফোন)</th>
//                   <th className="p-4">অ্যাকশন টাইপ</th>
//                   <th className="p-4">টার্গেট ইউজার</th>
//                   <th className="p-4">বিস্তারিত বিবরণ</th>
//                   <th className="p-4">আইপি অ্যাড্রেস</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-800/60 text-sm">
//                 {currentLogs.map((log) => (
//                   <tr key={log._id} className="hover:bg-slate-800/40 transition">
//                     <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
//                       {new Date(log.createdAt).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}
//                     </td>
//                     <td className="p-4 font-semibold text-emerald-400 whitespace-nowrap">{log.adminPhone}</td>
//                     <td className="p-4 whitespace-nowrap">
//                       <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
//                         {log.action}
//                       </span>
//                     </td>
//                     <td className="p-4 text-slate-300 font-mono text-xs whitespace-nowrap">{log.targetUser || 'N/A'}</td>
//                     <td className="p-4 text-slate-300 text-xs max-w-md">{log.details}</td>
//                     <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">{log.ipAddress}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// //////////////////////////////////////////////////////////////

'use client';

import { useState, useEffect } from 'react';

export default function AuditLogsPage() {
  const [data, setData] = useState({ logs: [], groupedLogs: {} });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showAllCategories, setShowAllCategories] = useState(false); // ৫টির বেশি ক্যাটাগরি হাইড/শো করার স্টেট

  const allPermissions = [
    { key: 'all', label: 'সকল লগ' },
    { key: 'dashboard', label: 'ড্যাশবোর্ড' },
    { key: 'tracking', label: 'ট্র্যাকিং' },
    { key: 'users', label: 'ইউজার' },
    { key: 'deposits', label: 'ডিপোজিট' },
    { key: 'withdraws', label: 'উইথড্র' },
    { key: 'referrals', label: 'রেফারেল' },
    { key: 'payments', label: 'পেমেন্ট' },
    { key: 'methods', label: 'মেথডস' },
    { key: 'exchange_rate', label: 'Exchange Rate' },
    { key: 'nowpayments', label: 'NowPayments' },
    { key: 'auto_crypto', label: 'Auto Crypto' },
    { key: 'bonus_settings', label: 'বোনাস সেটিংস' },
    { key: 'bonus_history', label: 'বোনাস ইতিহাস' },
    { key: 'others', label: 'অন্যান্য' },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit-logs');
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setMessage(result.message);
      }
    } catch (err) {
      setMessage('লগ লোড করতে গিয়ে সমস্যা হয়েছে');
    }
    setLoading(false);
  };

  const getFilteredLogs = () => {
    let list = [];
    if (selectedGroup === 'all') {
      list = data.logs || [];
    } else {
      list = data.groupedLogs?.[selectedGroup] || [];
    }

    if (!search.trim()) return list;

    const term = search.toLowerCase();
    return list.filter(log => 
      log.adminPhone?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.ipAddress?.toLowerCase().includes(term) ||
      log.targetUser?.toLowerCase().includes(term)
    );
  };

  const currentLogs = getFilteredLogs();

  // ক্যাটাগরি ৫টির বেশি হলে হাইড করার জন্য স্লাইস করা
  const displayedCategories = showAllCategories ? allPermissions : allPermissions.slice(0, 5);

  return (
    <div className="p-6 text-white max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">🛡️ সাব-অ্যাডমিন অডিট লগ কন্ট্রোল প্যানেল</h1>
          <p className="text-sm text-slate-400 mt-1">পারমিশন অনুযায়ী সাব-অ্যাডমিনদের কার্যক্রমের সুনির্দিষ্ট ট্র্যাকিং</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-sm font-semibold shadow-lg shadow-emerald-900/20 flex items-center gap-2"
        >
          🔄 রিফ্রেশ করুন
        </button>
      </div>

      {message && <div className="p-4 mb-6 bg-red-950/80 border border-red-800 rounded-xl text-red-200">{message}</div>}

      <div className="bg-[#0b132b] border border-slate-800 p-5 rounded-2xl shadow-xl mb-6 flex flex-col gap-4">
        <div className="w-full md:w-1/3">
          <input 
            type="text" 
            placeholder="অ্যাডমিন ফোন, বিবরণ, বা আইপি দিয়ে খুঁজুন..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#070b19] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* ক্যাটাগরি ফিল্টার বাটনস */}
        <div className="flex flex-wrap items-center gap-2">
          {displayedCategories.map((cat) => {
            const count = cat.key === 'all' ? (data.logs?.length || 0) : (data.groupedLogs?.[cat.key]?.length || 0);
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedGroup(cat.key)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedGroup === cat.key
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-[#070b19] text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  selectedGroup === cat.key ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* আরও দেখুন / সংকুচিত করুন বাটন */}
          {allPermissions.length > 5 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition flex items-center gap-1"
            >
              {showAllCategories ? '▲ কম দেখুন' : `▼ আরও দেখুন (${allPermissions.length - 5}টি)`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-xl">
          অডিট লগ লোড হচ্ছে...
        </div>
      ) : currentLogs.length === 0 ? (
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 shadow-xl">
          এই ক্যাটাগরিতে কোনো অডিট লগ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* টেবিল বডি ১০টির বেশি হলে ফিক্সড হাইট ও স্ক্রোল সিস্টেম */}
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#070b19] z-10">
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">সময়</th>
                  <th className="p-4">অ্যাডমিন (ফোন)</th>
                  <th className="p-4">অ্যাকশন টাইপ</th>
                  <th className="p-4">টার্গেট ইউজার</th>
                  <th className="p-4">বিস্তারিত বিবরণ</th>
                  <th className="p-4">আইপি অ্যাড্রেস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {currentLogs.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}
                    </td>
                    <td className="p-4 font-semibold text-emerald-400 whitespace-nowrap">{log.adminPhone}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-xs whitespace-nowrap">{log.targetUser || 'N/A'}</td>
                    <td className="p-4 text-slate-300 text-xs max-w-md">{log.details}</td>
                    <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}