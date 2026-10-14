

// // ///////////////////////////////////////////////////////////////
// import { NextResponse } from 'next/server';
// import dbConnect from '@/utils/db';
// import Setting from '@/models/Setting';
// import { verifyAuth } from '@/utils/authCheck';

// const DEFAULT_RATE = 120;

// // GET: Current rate (লগইন করা ইউজার এবং অ্যাডমিন উভয়ই রিড করতে পারবে)
// export async function GET(req) {
//   try {
//     await dbConnect();

//     // এখানে verifyAuth() ব্যবহার করা হয়েছে যাতে যেকোনো লগইন করা ইউজার (ইউজার বা অ্যাডমিন) রেটটি দেখতে পারে
//     const auth = await verifyAuth(); 
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message || 'অনুমতি নেই!' }, { status: auth.status || 401 });
//     }

//     const setting = await Setting.findOne({ key: 'usdToBdtRate' });
//     const rate = setting?.value || DEFAULT_RATE;

//     return NextResponse.json({ 
//       success: true, 
//       rate: Number(rate),
//       updatedAt: setting?.updatedAt || null,
//       source: setting ? 'database' : 'default'
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Exchange Rate GET Error:', error);
//     return NextResponse.json({ 
//       success: false, 
//       message: 'সার্ভার এরর!',
//       rate: DEFAULT_RATE
//     }, { status: 500 });
//   }
// }

// // POST: Update rate (এটি আগের মতোই শুধু অ্যাডমিনের জন্য সুরক্ষিত থাকবে)
// export async function POST(req) {
//   try {
//     await dbConnect();

//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
//     }

//     let body;
//     try {
//       body = await req.json();
//     } catch (e) {
//       return NextResponse.json({ success: false, message: 'অবৈধ ডেটা!' }, { status: 400 });
//     }

//     const { rate } = body || {};
//     const parsedRate = Number(rate);

//     if (isNaN(parsedRate) || parsedRate <= 0) {
//       return NextResponse.json({ 
//         success: false, 
//         message: 'সঠিক rate দিন (ধনাত্মক সংখ্যা)!' 
//       }, { status: 400 });
//     }

//     if (parsedRate < 50 || parsedRate > 500) {
//       return NextResponse.json({ 
//         success: false, 
//         message: 'Rate অবশ্যই ৫০ থেকে ৫০০ এর মধ্যে হতে হবে!' 
//       }, { status: 400 });
//     }

//     const updated = await Setting.findOneAndUpdate(
//       { key: 'usdToBdtRate' },
//       { value: parsedRate },
//       { upsert: true, new: true }
//     );

//     return NextResponse.json({ 
//       success: true, 
//       message: `✅ Exchange rate সফলভাবে ৳${parsedRate} এ আপডেট হয়েছে!`,
//       rate: parsedRate,
//       updatedAt: updated.updatedAt
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Exchange Rate POST Error:', error);
//     return NextResponse.json({ 
//       success: false, 
//       message: 'সার্ভার এরর!' 
//     }, { status: 500 });
//   }
// }

// /////////////////////////////////////////////////////


import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import BonusSetting from '@/models/BonusSetting';
import { verifyAuth } from '@/utils/authCheck';
import AuditLog from '@/models/AuditLog'; // ✅ অডিট লগ মডেল ইমপোর্ট করা হলো

// ==========================================
// ✅ GET — বোনাস সেটিংস পাওয়া
// ==========================================
export async function GET(req) {
  try {
    await dbConnect();

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    let settings = await BonusSetting.findOne({});

    // যদি কোনো সেটিংস না থাকে — ডিফল্ট তৈরি করি
    if (!settings) {
      settings = await BonusSetting.create({});
    }

    return NextResponse.json({
      success: true,
      settings
    }, { status: 200 });

  } catch (error) {
    console.error('Bonus Settings GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার এরর: ' + error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// ✅ PATCH — বোনাস সেটিংস আপডেট (Atomic Upsert + Audit Log)
// ==========================================
export async function PATCH(req) {
  try {
    await dbConnect();

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const adminUser = auth.user; // ✅ সাব-অ্যাডমিন বা অ্যাডমিন ইউজার অবজেক্ট

    const body = await req.json();

    // ✅ কোন কোন ফিল্ড আপডেট করা যাবে
    // ✅ এখন সবগুলো আলাদা rank ফিল্ড যোগ করা হলো[cite: 9]
    const allowedFields = [
      // সাপ্তাহিক
      'weeklyBonusEnabled',
      'depositBonusEnabled',
      'depositBonusPercent',
      'depositBonusMax',
      'depositBonusMinDeposit',
      'cashbackEnabled',
      'cashbackPercent',
      'cashbackMax',
      'cashbackMinTurnover',
      // মাসিক
      'topRankerEnabled',
      'topRankerCount',
      // ✅ ১১টি আলাদা rank ফিল্ড[cite: 9]
      'rank1Prize',
      'rank2Prize',
      'rank3Prize',
      'rank4Prize',
      'rank5Prize',
      'rank6Prize',
      'rank7Prize',
      'rank8Prize',
      'rank9Prize',
      'rank10Prize',
      'rank11PlusPrize',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // ✅ Atomic upsert — Race Condition মুক্ত[cite: 9]
    // - এক query-তে ডকুমেন্ট তৈরি বা আপডেট
    // - upsert: true → না থাকলে তৈরি হবে
    // - setDefaultsOnInsert: true → ডিফল্ট মান বসবে
    const settings = await BonusSetting.findOneAndUpdate(
      {},                              // যেকোনো একটি ডকুমেন্ট[cite: 9]
      { $set: updateData },
      {
        new: true,                     // আপডেটেড ডকুমেন্ট ফেরত[cite: 9]
        upsert: true,                  // না থাকলে তৈরি হবে[cite: 9]
        setDefaultsOnInsert: true,     // ডিফল্ট মান বসবে[cite: 9]
      }
    );

    // ==========================================
    // ✅ সাব-অ্যাডমিন অ্যাকশনের অডিট লগ সেভ করা
    // ==========================================
    if (adminUser && adminUser.role === 'sub-admin') {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: 'UPDATE_BONUS_SETTINGS',
        targetUser: 'SYSTEM_SETTINGS',
        details: `সাব-অ্যাডমিন (${adminUser.phone}) কর্তৃক বোনাস সেটিংস আপডেট করা হয়েছে।`,
        ipAddress: ip
      });
    }

    return NextResponse.json({
      success: true,
      message: '✅ বোনাস সেটিংস সফলভাবে আপডেট হয়েছে!',
      settings
    }, { status: 200 });

  } catch (error) {
    console.error('Bonus Settings PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার এরর: ' + error.message },
      { status: 500 }
    );
  }
}