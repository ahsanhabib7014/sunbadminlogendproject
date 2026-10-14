// // // import { NextResponse } from 'next/server';
// // // import { cookies } from 'next/headers';
// // // import jwt from 'jsonwebtoken';
// // // import dbConnect from '@/utils/db'; // আপনার ডাটাবেজ কানেকশন ফাইল অনুযায়ী পাথ ঠিক করে নিবেন
// // // import AuditLog from '@/models/AuditLog';

// // // export async function GET(req) {
// // //   try {
// // //     const cookieStore = await cookies();
// // //     const token = cookieStore.get('token')?.value;

// // //     if (!token) {
// // //       return NextResponse.json({ success: false, message: 'অনুমোদন নেই (Unauthorized)' }, { status: 401 });
// // //     }

// // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
// // //     // কেবল সুপার অ্যাডমিন (`admin`) এই লগগুলো দেখতে পারবে
// // //     if (decoded.role !== 'admin') {
// // //       return NextResponse.json({ success: false, message: 'আপনার এই পেজ দেখার অনুমতি নেই' }, { status: 403 });
// // //     }

// // //     await dbConnect();

// // //     // সাম্প্রতিক লগগুলো প্রথমে দেখানোর জন্য sort করা (সর্বোচ্চ ১০০টি)
// // //     const logs = await AuditLog.find({})
// // //       .sort({ createdAt: -1 })
// // //       .limit(100)
// // //       .lean();

// // //     return NextResponse.json({ success: true, logs });
// // //   } catch (err) {
// // //     console.error('Fetch audit logs error:', err);
// // //     return NextResponse.json({ success: false, message: 'সার্ভারে ত্রুটি ঘটেছে' }, { status: 500 });
// // //   }
// // // }
// // // /////////////////////////////////////
// // import { NextResponse } from 'next/server';
// // import { cookies } from 'next/headers';
// // import jwt from 'jsonwebtoken';
// // import dbConnect from '@/utils/db';
// // import AuditLog from '@/models/AuditLog';

// // export async function GET(req) {
// //   try {
// //     const cookieStore = await cookies();
// //     const token = cookieStore.get('token')?.value;

// //     if (!token) {
// //       return NextResponse.json({ success: false, message: 'অনুমোদন নেই (Unauthorized)' }, { status: 401 });
// //     }

// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
// //     // কেবল সুপার অ্যাডমিন (`admin`) এই লগগুলো দেখতে পারবে
// //     if (decoded.role !== 'admin') {
// //       return NextResponse.json({ success: false, message: 'আপনার এই পেজ দেখার অনুমতি নেই' }, { status: 403 });
// //     }

// //     await dbConnect();

// //     // সাম্প্রতিক লগগুলো প্রথমে দেখানোর জন্য sort করা (সর্বোচ্চ ১০০টি)
// //     const logs = await AuditLog.find({})
// //       .sort({ createdAt: -1 })
// //       .limit(100)
// //       .lean();

// //     // =====================================================================
// //     // ✅ আপনার ফ্রন্টএন্ডের পারমিশন কি (Keys) গুলোর সাথে হুবহু ম্যাচ করে গ্রুপ করা
// //     // =====================================================================
// //     const groupedLogs = {
// //       manage_dashboard: [],
// //       view_game_tracking: [],
// //       manage_users: [],
// //       manage_deposits: [],
// //       manage_withdraws: [],
// //       manage_referrals: [],
// //       manage_payments: [],
// //       manage_methods: [],
// //       manage_exchange_rate: [],
// //       manage_nowpayments: [],
// //       manage_auto_crypto: [],
// //       manage_bonus_settings: [],
// //       view_bonus_history: [],
// //       others: []
// //     };

// //     logs.forEach(log => {
// //       const act = String(log.action || '').toUpperCase();
// //       const details = String(log.details || '').toLowerCase();

// //       if (act.includes('DASHBOARD')) {
// //         groupedLogs.manage_dashboard.push(log);
// //       } else if (act.includes('TRACKING') || act.includes('GAME')) {
// //         groupedLogs.view_game_tracking.push(log);
// //       } else if (act.includes('USER') || act.includes('BALANCE') || act.includes('COMMISSION') || details.includes('ইউজার')) {
// //         groupedLogs.manage_users.push(log);
// //       } else if (act.includes('DEPOSIT')) {
// //         groupedLogs.manage_deposits.push(log);
// //       } else if (act.includes('WITHDRAW')) {
// //         groupedLogs.manage_withdraws.push(log);
// //       } else if (act.includes('REFERRAL')) {
// //         groupedLogs.manage_referrals.push(log);
// //       } else if (act.includes('PAYMENT')) {
// //         groupedLogs.manage_payments.push(log);
// //       } else if (act.includes('METHOD')) {
// //         groupedLogs.manage_methods.push(log);
// //       } else if (act.includes('EXCHANGE') || act.includes('RATE')) {
// //         groupedLogs.manage_exchange_rate.push(log);
// //       } else if (act.includes('NOWPAYMENT')) {
// //         groupedLogs.manage_nowpayments.push(log);
// //       } else if (act.includes('CRYPTO')) {
// //         groupedLogs.manage_auto_crypto.push(log);
// //       } else if (act.includes('BONUS_SETTING') || details.includes('বোনাস সেটিংস')) {
// //         groupedLogs.manage_bonus_settings.push(log);
// //       } else if (act.includes('BONUS') || act.includes('HISTORY') || details.includes('বোনাস ইতিহাস')) {
// //         groupedLogs.view_bonus_history.push(log);
// //       } else {
// //         groupedLogs.others.push(log);
// //       }
// //     });

// //     return NextResponse.json({ 
// //       success: true, 
// //       logs,          // সব লগ
// //       groupedLogs    // পারমিশন অনুযায়ী ক্যাটাগরি গ্রুপ করা লগ
// //     });

// //   } catch (err) {
// //     console.error('Fetch audit logs error:', err);
// //     return NextResponse.json({ success: false, message: 'সার্ভারে ত্রুটি ঘটেছে' }, { status: 500 });
// //   }
// // }

// // /////////////////////////////////////////////////
// import { NextResponse } from 'next/server';
// import { cookies } from 'next/headers';
// import jwt from 'jsonwebtoken';
// import dbConnect from '@/utils/db';
// import AuditLog from '@/models/AuditLog';

// export async function GET(req) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get('token')?.value;

//     if (!token) {
//       return NextResponse.json({ success: false, message: 'অনুমোদন নেই (Unauthorized)' }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     if (decoded.role !== 'admin') {
//       return NextResponse.json({ success: false, message: 'আপনার এই পেজ দেখার অনুমতি নেই' }, { status: 403 });
//     }

//     await dbConnect();

//     const logs = await AuditLog.find({})
//       .sort({ createdAt: -1 })
//       .limit(200)
//       .lean();

//     // ক্যাটাগরিগুলো ইনিশিয়ালাইজ করা
//     const groupedLogs = {
//       manage_dashboard: [],
//       view_game_tracking: [],
//       manage_users: [],
//       manage_deposits: [],
//       manage_withdraws: [],
//       manage_referrals: [],
//       manage_payments: [],
//       manage_methods: [],
//       manage_exchange_rate: [],
//       manage_nowpayments: [],
//       manage_auto_crypto: [],
//       manage_bonus_settings: [],
//       view_bonus_history: [],
//       others: []
//     };

//     logs.forEach(log => {
//       const act = String(log.action || '').toLowerCase();
//       const details = String(log.details || '').toLowerCase();
//       const combined = `${act} ${details}`;

//       // সুনির্দিষ্ট চেক যাতে কোনো লগ মিস না হয়
//       if (combined.includes('dashboard') || combined.includes('ড্যাশবোর্ড')) {
//         groupedLogs.manage_dashboard.push(log);
//       } else if (combined.includes('track') || combined.includes('game') || combined.includes('ট্র্যাকিং')) {
//         groupedLogs.view_game_tracking.push(log);
//       } else if (combined.includes('user') || combined.includes('balance') || combined.includes('commission') || combined.includes('ইউজার') || combined.includes('ব্যালেন্স')) {
//         groupedLogs.manage_users.push(log);
//       } else if (combined.includes('deposit') || combined.includes('ডিপোজিট')) {
//         groupedLogs.manage_deposits.push(log);
//       } else if (combined.includes('withdraw') || combined.includes('উইথড্র')) {
//         groupedLogs.manage_withdraws.push(log);
//       } else if (combined.includes('referral') || combined.includes('রেফারেল')) {
//         groupedLogs.manage_referrals.push(log);
//       } else if (combined.includes('payment') || combined.includes('পেমেন্ট')) {
//         groupedLogs.manage_payments.push(log);
//       } else if (combined.includes('method') || combined.includes('মেথড')) {
//         groupedLogs.manage_methods.push(log);
//       } else if (combined.includes('exchange') || combined.includes('rate')) {
//         groupedLogs.manage_exchange_rate.push(log);
//       } else if (combined.includes('nowpayment')) {
//         groupedLogs.manage_nowpayments.push(log);
//       } else if (combined.includes('crypto')) {
//         groupedLogs.manage_auto_crypto.push(log);
//       } else if (combined.includes('bonus_setting') || combined.includes('বোনাস সেটিংস')) {
//         groupedLogs.manage_bonus_settings.push(log);
//       } else if (combined.includes('bonus') || combined.includes('history') || combined.includes('বোনাস ইতিহাস')) {
//         groupedLogs.view_bonus_history.push(log);
//       } else {
//         groupedLogs.others.push(log);
//       }
//     });

//     return NextResponse.json({ 
//       success: true, 
//       logs, 
//       groupedLogs 
//     });

//   } catch (err) {
//     console.error('Fetch audit logs error:', err);
//     return NextResponse.json({ success: false, message: 'সার্ভারে ত্রুটি ঘটেছে' }, { status: 500 });
//   }
// }

// //////////////////////////////////////////

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/utils/db';
import AuditLog from '@/models/AuditLog';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'অনুমোদন নেই (Unauthorized)' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'আপনার এই পেজ দেখার অনুমতি নেই' }, { status: 403 });
    }

    await dbConnect();

    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const groupedLogs = {
      manage_dashboard: [],
      view_game_tracking: [],
      manage_users: [],
      manage_deposits: [],
      manage_withdraws: [],
      manage_referrals: [],
      manage_payments: [],
      manage_methods: [],
      manage_exchange_rate: [],
      manage_nowpayments: [],
      manage_auto_crypto: [],
      manage_bonus_settings: [],
      view_bonus_history: [],
      others: []
    };

    logs.forEach(log => {
      const act = String(log.action || '').toLowerCase();
      const details = String(log.details || '').toLowerCase();
      const combined = `${act} ${details}`;

      // ইউজার পারমিশন বা অ্যাকশনগুলোর সঠিক ক্যাটাগরিতে ম্যাপিং
      if (combined.includes('dashboard') || combined.includes('ড্যাশবোর্ড')) {
        groupedLogs.manage_dashboard.push(log);
      } else if (combined.includes('track') || combined.includes('game') || combined.includes('ট্র্যাকিং')) {
        groupedLogs.view_game_tracking.push(log);
      } else if (combined.includes('user') || combined.includes('balance') || combined.includes('commission') || combined.includes('ইউজার') || combined.includes('ব্যালেন্স')) {
        groupedLogs.manage_users.push(log);
      } else if (combined.includes('deposit') || combined.includes('ডিপোজিট')) {
        groupedLogs.manage_deposits.push(log);
      } else if (combined.includes('withdraw') || combined.includes('উইথড্র')) {
        groupedLogs.manage_withdraws.push(log);
      } else if (combined.includes('referral') || combined.includes('রেফারেল')) {
        groupedLogs.manage_referrals.push(log);
      } else if (combined.includes('payment') || combined.includes('পেমেন্ট')) {
        groupedLogs.manage_payments.push(log);
      } else if (combined.includes('method') || combined.includes('মেথড')) {
        groupedLogs.manage_methods.push(log);
      } else if (combined.includes('exchange') || combined.includes('rate')) {
        groupedLogs.manage_exchange_rate.push(log);
      } else if (combined.includes('nowpayment')) {
        groupedLogs.manage_nowpayments.push(log);
      } else if (combined.includes('crypto')) {
        groupedLogs.manage_auto_crypto.push(log);
      } else if (combined.includes('bonus_setting') || combined.includes('বোনাস সেটিংস')) {
        groupedLogs.manage_bonus_settings.push(log);
      } else if (combined.includes('bonus') || combined.includes('history') || combined.includes('বোনাস ইতিহাস')) {
        groupedLogs.view_bonus_history.push(log);
      } else {
        groupedLogs.others.push(log);
      }
    });

    return NextResponse.json({ 
      success: true, 
      logs, 
      groupedLogs 
    });

  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return NextResponse.json({ success: false, message: 'সার্ভারে ত্রুটি ঘটেছে' }, { status: 500 });
  }
}