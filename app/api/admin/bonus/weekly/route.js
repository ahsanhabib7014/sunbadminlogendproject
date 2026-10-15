// // // ////////////////////////////////////////////////////

// // import { NextResponse } from 'next/server';
// // import dbConnect from '@/utils/db';
// // import User from '@/models/User';
// // import Deposit from '@/models/Deposit';
// // import Withdraw from '@/models/Withdraw';
// // import BonusSetting from '@/models/BonusSetting';
// // import BonusRunLog from '@/models/BonusRunLog';
// // import { verifyAuth } from '@/utils/authCheck';

// // // ==========================================
// // // সপ্তাহের key বের করার helper
// // // ==========================================
// // function getWeekKey(date = new Date()) {
// //   const d = new Date(date);
// //   const year = d.getFullYear();
// //   const oneJan = new Date(year, 0, 1);
// //   const days = Math.floor((d - oneJan) / 86400000);
// //   const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
// //   return `${year}-W${String(weekNum).padStart(2, '0')}`;
// // }

// // // ==========================================
// // // ✅ POST — সাপ্তাহিক বোনাস দেওয়া (Atomic + Logging)
// // // ==========================================
// // export async function POST(req) {
// //   const startedAt = Date.now();
// //   try {
// //     await dbConnect();

// //     // ১. Auth check
// //     const auth = await verifyAuth('admin');
// //     if (!auth.success) {
// //       return NextResponse.json(
// //         { success: false, message: auth.message },
// //         { status: auth.status }
// //       );
// //     }

// //     // ২. বোনাস সেটিংস
// //     let settings = await BonusSetting.findOne({});
// //     if (!settings) {
// //       settings = await BonusSetting.create({});
// //     }

// //     if (!settings.weeklyBonusEnabled) {
// //       return NextResponse.json(
// //         { success: false, message: 'সাপ্তাহিক বোনাস বন্ধ আছে!' },
// //         { status: 400 }
// //       );
// //     }

// //     // ৩. এই সপ্তাহের key
// //     const thisWeekKey = getWeekKey();

// //     // ৪. সব ইউজার আনা
// //     const users = await User.find({ role: 'user' });

// //     let depositBonusCount = 0;
// //     let cashbackCount = 0;
// //     let totalDepositBonus = 0;
// //     let totalCashback = 0;
// //     let raceCaught = 0;
// //     let failedCount = 0;

// //     const details = [];
// //     const skipped = [];

// //     // ৫. প্রতিটি ইউজারের জন্য atomic update
// //     for (const user of users) {
// //       // ✅ চেক #১: already got
// //       const alreadyGot = user.weeklyBonusHistory?.some(
// //         (h) => h.week === thisWeekKey
// //       );
// //       if (alreadyGot) {
// //         skipped.push({
// //           uid: user.uid,
// //           phone: user.phone,
// //           reason: 'already_got',
// //           weeklyDeposit: user.weeklyDeposit || 0,
// //           weeklyLost: user.weeklyLost || 0,
// //         });
// //         continue;
// //       }

// //       let userBonus = 0;
// //       let depositBonusTurnover = 0;
// //       let cashbackAmount = 0;
// //       let depositBonusAmount = 0;
// //       const userDetails = { uid: user.uid, phone: user.phone, bonuses: [] };

// //       // ==========================================
// //       // ✅ ডিপোজিট বোনাস
// //       // ==========================================
// //       if (
// //         settings.depositBonusEnabled &&
// //         (user.weeklyDeposit || 0) >= settings.depositBonusMinDeposit
// //       ) {
// //         let depositBonus = (user.weeklyDeposit || 0) * (settings.depositBonusPercent / 100);
// //         if (depositBonus > settings.depositBonusMax) {
// //           depositBonus = settings.depositBonusMax;
// //         }
// //         depositBonus = Math.round(depositBonus);

// //         if (depositBonus > 0) {
// //           depositBonusAmount = depositBonus;
// //           userBonus += depositBonus;
// //           depositBonusTurnover = depositBonus * 2;

// //           userDetails.bonuses.push({
// //             type: 'ডিপোজিট বোনাস',
// //             amount: depositBonus,
// //             turnover: depositBonusTurnover,
// //           });
// //         }
// //       }

// //       // ==========================================
// //       // ✅ ক্যাশব্যাক
// //       // ==========================================
// //       if (
// //         settings.cashbackEnabled &&
// //         (user.weeklyTurnover || 0) >= settings.cashbackMinTurnover &&
// //         (user.weeklyLost || 0) > 0
// //       ) {
// //         let cashback = (user.weeklyLost || 0) * (settings.cashbackPercent / 100);
// //         if (cashback > settings.cashbackMax) {
// //           cashback = settings.cashbackMax;
// //         }
// //         cashback = Math.round(cashback);

// //         if (cashback > 0) {
// //           cashbackAmount = cashback;
// //           userBonus += cashback;

// //           userDetails.bonuses.push({
// //             type: 'ক্যাশব্যাক',
// //             amount: cashback,
// //           });
// //         }
// //       }

// //       // ==========================================
// //       // ✅ কোনো bonus না পাওয়ার যোগ্য হলে — skip
// //       // ==========================================
// //       if (userBonus <= 0) {
// //         let reason = 'no_eligible_bonus';
// //         if (settings.depositBonusEnabled && (user.weeklyDeposit || 0) < settings.depositBonusMinDeposit) {
// //           reason = 'below_min_deposit';
// //         } else if (settings.cashbackEnabled && (user.weeklyLost || 0) <= 0) {
// //           reason = 'no_loss';
// //         }

// //         skipped.push({
// //           uid: user.uid,
// //           phone: user.phone,
// //           reason,
// //           weeklyDeposit: user.weeklyDeposit || 0,
// //           weeklyLost: user.weeklyLost || 0,
// //         });
// //         continue;
// //       }

// //       // ==========================================
// //       // ✅ Atomic Update (CAS)
// //       // ==========================================
// //       if (userBonus > 0) {
// //         try {
// //           const updateResult = await User.updateOne(
// //             {
// //               _id: user._id,
// //               'weeklyBonusHistory.week': { $ne: thisWeekKey },
// //             },
// //             {
// //               $inc: {
// //                 balance: userBonus,
// //                 turnover: depositBonusTurnover,
// //                 ...(cashbackAmount > 0 ? { monthlyCashbackReceived: cashbackAmount } : {}),
// //               },
// //               $set: {
// //                 lastWeeklyBonusAt: new Date(),
// //                 weeklyTurnover: 0,
// //                 weeklyLost: 0,
// //                 weeklyDeposit: 0,
// //               },
// //               $push: {
// //                 weeklyBonusHistory: {
// //                   $each: [
// //                     ...(depositBonusAmount > 0 ? [{
// //                       amount: depositBonusAmount,
// //                       type: 'deposit',
// //                       week: thisWeekKey,
// //                       givenAt: new Date(),
// //                     }] : []),

// //                     ...(cashbackAmount > 0 ? [{
// //                       amount: cashbackAmount,
// //                       type: 'cashback',
// //                       week: thisWeekKey,
// //                       givenAt: new Date(),
// //                     }] : []),
// //                   ]
// //                 }
// //               }
// //             }
// //           );

// //           if (updateResult.modifiedCount > 0) {
// //             if (depositBonusAmount > 0) {
// //               depositBonusCount++;
// //               totalDepositBonus += depositBonusAmount;
// //             }
// //             if (cashbackAmount > 0) {
// //               cashbackCount++;
// //               totalCashback += cashbackAmount;
// //             }
// //             details.push(userDetails);
// //           } else {
// //             raceCaught++;
// //             skipped.push({
// //               uid: user.uid,
// //               phone: user.phone,
// //               reason: 'race_caught',
// //               weeklyDeposit: user.weeklyDeposit || 0,
// //               weeklyLost: user.weeklyLost || 0,
// //             });
// //           }
// //         } catch (err) {
// //           failedCount++;
// //           console.error(`Bonus error for ${user.uid}:`, err.message);
// //           skipped.push({
// //             uid: user.uid,
// //             phone: user.phone,
// //             reason: 'error: ' + err.message,
// //           });
// //         }
// //       }
// //     }

// //     // ৬. সেটিংসে ট্র্যাকিং আপডেট
// //     await BonusSetting.updateOne(
// //       { _id: settings._id },
// //       {
// //         $set: { lastWeeklyBonusAt: new Date() },
// //         $inc: { weeklyBonusGivenCount: 1 },
// //       }
// //     );

// //     // ✅ ৭. Log save
// //     await BonusRunLog.create({
// //       type: 'weekly',
// //       periodKey: thisWeekKey,
// //       summary: {
// //         totalGiven: details.length,
// //         totalSkipped: skipped.length,
// //         totalAmount: totalDepositBonus + totalCashback,
// //         depositBonusCount,
// //         cashbackCount,
// //         totalDepositBonus,
// //         totalCashback,
// //         raceCaught,
// //         failedCount,
// //         durationMs: Date.now() - startedAt,
// //       },
// //       given: details,
// //       skipped,
// //       runBy: auth.userId,
// //       runAt: new Date(),
// //     });

// //     return NextResponse.json({
// //       success: true,
// //       message: `✅ সাপ্তাহিক বোনাস দেওয়া হয়েছে!`,
// //       summary: {
// //         totalUsers: details.length,
// //         totalSkipped: skipped.length,
// //         depositBonusCount,
// //         cashbackCount,
// //         totalDepositBonus,
// //         totalCashback,
// //         totalBonus: totalDepositBonus + totalCashback,
// //         weekKey: thisWeekKey,
// //         raceCaught,
// //         failedCount,
// //       },
// //       details,
// //       skipped,
// //     }, { status: 200 });

// //   } catch (error) {
// //     console.error('Weekly Bonus Error:', error);
// //     return NextResponse.json(
// //       { success: false, message: 'সার্ভার এরর: ' + error.message },
// //       { status: 500 }
// //     );
// //   }
// // }

// // //////////////////////////////////////////

// import { NextResponse } from 'next/server';
// import dbConnect from '@/utils/db';
// import User from '@/models/User';
// import Deposit from '@/models/Deposit';
// import Withdraw from '@/models/Withdraw';
// import BonusSetting from '@/models/BonusSetting';
// import BonusRunLog from '@/models/BonusRunLog';
// import { verifyAuth } from '@/utils/authCheck';
// import AuditLog from '@/models/AuditLog'; // ✅ অডিট লগ মডেল ইমপোর্ট করা হলো

// // ==========================================
// // সপ্তাহের key বের করার helper
// // ==========================================
// function getWeekKey(date = new Date()) {
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const oneJan = new Date(year, 0, 1);
//   const days = Math.floor((d - oneJan) / 86400000);
//   const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
//   return `${year}-W${String(weekNum).padStart(2, '0')}`;
// }

// // ==========================================
// // ✅ POST — সাপ্তাহিক বোনাস দেওয়া (Atomic + Logging + Audit Log)
// // ==========================================
// export async function POST(req) {
//   const startedAt = Date.now();
//   try {
//     await dbConnect();

//     // ১. Auth check
//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json(
//         { success: false, message: auth.message },
//         { status: auth.status }
//       );
//     }

//     const adminUser = auth.user; // ✅ সাব-অ্যাডমিন বা অ্যাডমিন ইউজার অবজেক্ট[cite: 8]

//     // ২. বোনাস সেটিংস
//     let settings = await BonusSetting.findOne({});
//     if (!settings) {
//       settings = await BonusSetting.create({});
//     }

//     if (!settings.weeklyBonusEnabled) {
//       return NextResponse.json(
//         { success: false, message: 'সাপ্তাহিক বোনাস বন্ধ আছে!' },
//         { status: 400 }
//       );
//     }

//     // ৩. এই সপ্তাহের key
//     const thisWeekKey = getWeekKey();

//     // ৪. সব ইউজার আনা
//     const users = await User.find({ role: 'user' });

//     let depositBonusCount = 0;
//     let cashbackCount = 0;
//     let totalDepositBonus = 0;
//     let totalCashback = 0;
//     let raceCaught = 0;
//     let failedCount = 0;

//     const details = [];
//     const skipped = [];

//     // ৫. প্রতিটি ইউজারের জন্য atomic update
//     for (const user of users) {
//       // ✅ চেক #১: already got
//       const alreadyGot = user.weeklyBonusHistory?.some(
//         (h) => h.week === thisWeekKey
//       );
//       if (alreadyGot) {
//         skipped.push({
//           uid: user.uid,
//           phone: user.phone,
//           reason: 'already_got',
//           weeklyDeposit: user.weeklyDeposit || 0,
//           weeklyLost: user.weeklyLost || 0,
//         });
//         continue;
//       }

//       let userBonus = 0;
//       let depositBonusTurnover = 0;
//       let cashbackAmount = 0;
//       let depositBonusAmount = 0;
//       const userDetails = { uid: user.uid, phone: user.phone, bonuses: [] };

//       // ==========================================
//       // ✅ ডিপোজিট বোনাস
//       // ==========================================
//       if (
//         settings.depositBonusEnabled &&
//         (user.weeklyDeposit || 0) >= settings.depositBonusMinDeposit
//       ) {
//         let depositBonus = (user.weeklyDeposit || 0) * (settings.depositBonusPercent / 100);
//         if (depositBonus > settings.depositBonusMax) {
//           depositBonus = settings.depositBonusMax;
//         }
//         depositBonus = Math.round(depositBonus);

//         if (depositBonus > 0) {
//           depositBonusAmount = depositBonus;
//           userBonus += depositBonus;
//           depositBonusTurnover = depositBonus * 2;

//           userDetails.bonuses.push({
//             type: 'ডিপোজিট বোনাস',
//             amount: depositBonus,
//             turnover: depositBonusTurnover,
//           });
//         }
//       }

//       // ==========================================
//       // ✅ ক্যাশব্যাক
//       // ==========================================
//       if (
//         settings.cashbackEnabled &&
//         (user.weeklyTurnover || 0) >= settings.cashbackMinTurnover &&
//         (user.weeklyLost || 0) > 0
//       ) {
//         let cashback = (user.weeklyLost || 0) * (settings.cashbackPercent / 100);
//         if (cashback > settings.cashbackMax) {
//           cashback = settings.cashbackMax;
//         }
//         cashback = Math.round(cashback);

//         if (cashback > 0) {
//           cashbackAmount = cashback;
//           userBonus += cashback;

//           userDetails.bonuses.push({
//             type: 'ক্যাশব্যাক',
//             amount: cashback,
//           });
//         }
//       }

//       // ==========================================
//       // ✅ কোনো bonus না পাওয়ার যোগ্য হলে — skip
//       // ==========================================
//       if (userBonus <= 0) {
//         let reason = 'no_eligible_bonus';
//         if (settings.depositBonusEnabled && (user.weeklyDeposit || 0) < settings.depositBonusMinDeposit) {
//           reason = 'below_min_deposit';
//         } else if (settings.cashbackEnabled && (user.weeklyLost || 0) <= 0) {
//           reason = 'no_loss';
//         }

//         skipped.push({
//           uid: user.uid,
//           phone: user.phone,
//           reason,
//           weeklyDeposit: user.weeklyDeposit || 0,
//           weeklyLost: user.weeklyLost || 0,
//         });
//         continue;
//       }

//       // ==========================================
//       // ✅ Atomic Update (CAS)
//       // ==========================================
//       if (userBonus > 0) {
//         try {
//           const updateResult = await User.updateOne(
//             {
//               _id: user._id,
//               'weeklyBonusHistory.week': { $ne: thisWeekKey },
//             },
//             {
//               $inc: {
//                 balance: userBonus,
//                 turnover: depositBonusTurnover,
//                 ...(cashbackAmount > 0 ? { monthlyCashbackReceived: cashbackAmount } : {}),
//               },
//               $set: { lastWeeklyBonusAt: new Date(), weeklyTurnover: 0, weeklyLost: 0, weeklyDeposit: 0, },$push: {
//                 weeklyBonusHistory: {
//                   $each: [
//                     ...(depositBonusAmount > 0 ? [{
//                       amount: depositBonusAmount,
//                       type: 'deposit',
//                       week: thisWeekKey,
//                       givenAt: new Date(),
//                     }] : []),

//                     ...(cashbackAmount > 0 ? [{
//                       amount: cashbackAmount,
//                       type: 'cashback',
//                       week: thisWeekKey,
//                       givenAt: new Date(),
//                     }] : []),
//                   ]
//                 }
//               }
//             }
//           );

//           if (updateResult.modifiedCount > 0) {
//             if (depositBonusAmount > 0) {
//               depositBonusCount++;
//               totalDepositBonus += depositBonusAmount;
//             }
//             if (cashbackAmount > 0) {
//               cashbackCount++;
//               totalCashback += cashbackAmount;
//             }
//             details.push(userDetails);
//           } else {
//             raceCaught++;
//             skipped.push({
//               uid: user.uid,
//               phone: user.phone,
//               reason: 'race_caught',
//               weeklyDeposit: user.weeklyDeposit || 0,
//               weeklyLost: user.weeklyLost || 0,
//             });
//           }
//         } catch (err) {
//           failedCount++;
//           console.error(`Bonus error for ${user.uid}:`, err.message);
//           skipped.push({
//             uid: user.uid,
//             phone: user.phone,
//             reason: 'error: ' + err.message,
//           });
//         }
//       }
//     }

//     // ৬. সেটিংসে ট্র্যাকিং আপডেট
//     await BonusSetting.updateOne(
//       { _id: settings._id },
//       {
//         $set: { lastWeeklyBonusAt: new Date() },$inc: { weeklyBonusGivenCount: 1 },
//       }
//     );

//     // ✅ ৭. Log save (BonusRunLog)
//     await BonusRunLog.create({
//       type: 'weekly',
//       periodKey: thisWeekKey,
//       summary: {
//         totalGiven: details.length,
//         totalSkipped: skipped.length,
//         totalAmount: totalDepositBonus + totalCashback,
//         depositBonusCount,
//         cashbackCount,
//         totalDepositBonus,
//         totalCashback,
//         raceCaught,
//         failedCount,
//         durationMs: Date.now() - startedAt,
//       },
//       given: details,
//       skipped,
//       runBy: auth.userId,
//       runAt: new Date(),
//     });

//     // ==========================================
//     // ✅ সাব-অ্যাডমিন অ্যাকশনের অডিট লগ সেভ করা
//     // ==========================================
//     if (adminUser && adminUser.role === 'sub-admin') {
//       const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
//       await AuditLog.create({
//         adminId: adminUser._id,
//         adminPhone: adminUser.phone || adminUser.uid,
//         action: 'DISTRIBUTE_WEEKLY_BONUS',
//         targetUser: 'MULTIPLE_USERS',
//         details: `সাব-অ্যাডমিন (${adminUser.phone}) কর্তৃক সাপ্তাহিক বোনাস বিতরণ করা হয়েছে। সফল ইউজারের সংখ্যা: ${details.length} জন, মোট বোনাস: ৳${totalDepositBonus + totalCashback}`,
//         ipAddress: ip
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       message: `✅ সাপ্তাহিক বোনাস দেওয়া হয়েছে!`,
//       summary: {
//         totalUsers: details.length,
//         totalSkipped: skipped.length,
//         depositBonusCount,
//         cashbackCount,
//         totalDepositBonus,
//         totalCashback,
//         totalBonus: totalDepositBonus + totalCashback,
//         weekKey: thisWeekKey,
//         raceCaught,
//         failedCount,
//       },
//       details,
//       skipped,
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Weekly Bonus Error:', error);
//     return NextResponse.json(
//       { success: false, message: 'সার্ভার এরর: ' + error.message },
//       { status: 500 }
//     );
//   }
// }

// ////////////////////////////////////

import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Deposit from '@/models/Deposit';
import Withdraw from '@/models/Withdraw';
import BonusSetting from '@/models/BonusSetting';
import BonusRunLog from '@/models/BonusRunLog';
import { verifyAuth } from '@/utils/authCheck';
import AuditLog from '@/models/AuditLog'; // ✅ অডিট লগ মডেল ইমপোর্ট করা হলো

// ==========================================
// সপ্তাহের key বের করার helper
// ==========================================
function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((d - oneJan) / 86400000);
  const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// ==========================================
// ✅ POST — সাপ্তাহিক বোনাস দেওয়া (Atomic + Logging + Audit Log)
// ==========================================
export async function POST(req) {
  const startedAt = Date.now();
  try {
    await dbConnect();

    // ১. Auth check
    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const adminUser = auth.user; // ✅ অ্যাডমিন বা সাব-অ্যাডমিন ইউজার অবজেক্ট[cite: 8]

    // ২. বোনাস সেটিংস
    let settings = await BonusSetting.findOne({});
    if (!settings) {
      settings = await BonusSetting.create({});
    }

    if (!settings.weeklyBonusEnabled) {
      return NextResponse.json(
        { success: false, message: 'সাপ্তাহিক বোনাস বন্ধ আছে!' },
        { status: 400 }
      );
    }

    // ৩. এই সপ্তাহের key
    const thisWeekKey = getWeekKey();

    // ৪. সব ইউজার আনা
    const users = await User.find({ role: 'user' });

    let depositBonusCount = 0;
    let cashbackCount = 0;
    let totalDepositBonus = 0;
    let totalCashback = 0;
    let raceCaught = 0;
    let failedCount = 0;

    const details = [];
    const skipped = [];

    // ৫. প্রতিটি ইউজারের জন্য atomic update
    for (const user of users) {
      // ✅ চেক #১: already got
      const alreadyGot = user.weeklyBonusHistory?.some(
        (h) => h.week === thisWeekKey
      );
      if (alreadyGot) {
        skipped.push({
          uid: user.uid,
          phone: user.phone,
          reason: 'already_got',
          weeklyDeposit: user.weeklyDeposit || 0,
          weeklyLost: user.weeklyLost || 0,
        });
        continue;
      }

      let userBonus = 0;
      let depositBonusTurnover = 0;
      let cashbackAmount = 0;
      let depositBonusAmount = 0;
      const userDetails = { uid: user.uid, phone: user.phone, bonuses: [] };

      // ==========================================
      // ✅ ডিপোজিট বোনাস
      // ==========================================
      if (
        settings.depositBonusEnabled &&
        (user.weeklyDeposit || 0) >= settings.depositBonusMinDeposit
      ) {
        let depositBonus = (user.weeklyDeposit || 0) * (settings.depositBonusPercent / 100);
        if (depositBonus > settings.depositBonusMax) {
          depositBonus = settings.depositBonusMax;
        }
        depositBonus = Math.round(depositBonus);

        if (depositBonus > 0) {
          depositBonusAmount = depositBonus;
          userBonus += depositBonus;
          depositBonusTurnover = depositBonus * 2;

          userDetails.bonuses.push({
            type: 'ডিপোজিট বোনাস',
            amount: depositBonus,
            turnover: depositBonusTurnover,
          });
        }
      }

      // ==========================================
      // ✅ ক্যাশব্যাক
      // ==========================================
      if (
        settings.cashbackEnabled &&
        (user.weeklyTurnover || 0) >= settings.cashbackMinTurnover &&
        (user.weeklyLost || 0) > 0
      ) {
        let cashback = (user.weeklyLost || 0) * (settings.cashbackPercent / 100);
        if (cashback > settings.cashbackMax) {
          cashback = settings.cashbackMax;
        }
        cashback = Math.round(cashback);

        if (cashback > 0) {
          cashbackAmount = cashback;
          userBonus += cashback;

          userDetails.bonuses.push({
            type: 'ক্যাশব্যাক',
            amount: cashback,
          });
        }
      }

      // ==========================================
      // ✅ কোনো bonus না পাওয়ার যোগ্য হলে — skip
      // ==========================================
      if (userBonus <= 0) {
        let reason = 'no_eligible_bonus';
        if (settings.depositBonusEnabled && (user.weeklyDeposit || 0) < settings.depositBonusMinDeposit) {
          reason = 'below_min_deposit';
        } else if (settings.cashbackEnabled && (user.weeklyLost || 0) <= 0) {
          reason = 'no_loss';
        }

        skipped.push({
          uid: user.uid,
          phone: user.phone,
          reason,
          weeklyDeposit: user.weeklyDeposit || 0,
          weeklyLost: user.weeklyLost || 0,
        });
        continue;
      }

      // ==========================================
      // ✅ Atomic Update (CAS)
      // ==========================================
      if (userBonus > 0) {
        try {
          const updateResult = await User.updateOne(
            {
              _id: user._id,
              'weeklyBonusHistory.week': { $ne: thisWeekKey },
            },
            {
              $inc: {
                balance: userBonus,
                turnover: depositBonusTurnover,
                ...(cashbackAmount > 0 ? { monthlyCashbackReceived: cashbackAmount } : {}),
              },
              $set: { lastWeeklyBonusAt: new Date(), weeklyTurnover: 0, weeklyLost: 0, weeklyDeposit: 0, },$push: {
                weeklyBonusHistory: {
                  $each: [
                    ...(depositBonusAmount > 0 ? [{
                      amount: depositBonusAmount,
                      type: 'deposit',
                      week: thisWeekKey,
                      givenAt: new Date(),
                    }] : []),

                    ...(cashbackAmount > 0 ? [{
                      amount: cashbackAmount,
                      type: 'cashback',
                      week: thisWeekKey,
                      givenAt: new Date(),
                    }] : []),
                  ]
                }
              }
            }
          );

          if (updateResult.modifiedCount > 0) {
            if (depositBonusAmount > 0) {
              depositBonusCount++;
              totalDepositBonus += depositBonusAmount;
            }
            if (cashbackAmount > 0) {
              cashbackCount++;
              totalCashback += cashbackAmount;
            }
            details.push(userDetails);
          } else {
            raceCaught++;
            skipped.push({
              uid: user.uid,
              phone: user.phone,
              reason: 'race_caught',
              weeklyDeposit: user.weeklyDeposit || 0,
              weeklyLost: user.weeklyLost || 0,
            });
          }
        } catch (err) {
          failedCount++;
          console.error(`Bonus error for ${user.uid}:`, err.message);
          skipped.push({
            uid: user.uid,
            phone: user.phone,
            reason: 'error: ' + err.message,
          });
        }
      }
    }

    // ৬. সেটিংসে ট্র্যাকিং আপডেট
    await BonusSetting.updateOne(
      { _id: settings._id },
      {
        $set: { lastWeeklyBonusAt: new Date() },$inc: { weeklyBonusGivenCount: 1 },
      }
    );

    // ✅ ৭. Log save (BonusRunLog)
    await BonusRunLog.create({
      type: 'weekly',
      periodKey: thisWeekKey,
      summary: {
        totalGiven: details.length,
        totalSkipped: skipped.length,
        totalAmount: totalDepositBonus + totalCashback,
        depositBonusCount,
        cashbackCount,
        totalDepositBonus,
        totalCashback,
        raceCaught,
        failedCount,
        durationMs: Date.now() - startedAt,
      },
      given: details,
      skipped,
      runBy: auth.userId,
      runAt: new Date(),
    });

    // ==========================================
    // ✅ অডিট লগ সেভ করা (oldData এবং newData সহ)
    // ==========================================
    if (adminUser) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: 'DISTRIBUTE_WEEKLY_BONUS',
        targetUser: 'MULTIPLE_USERS',
        oldData: {
          weekKey: thisWeekKey,
          status: 'pending_distribution'
        },
        newData: {
          weekKey: thisWeekKey,
          totalSuccessfulUsers: details.length,
          totalDepositBonus,
          totalCashback,
          totalBonusAmount: totalDepositBonus + totalCashback,
          status: 'distributed'
        },
        details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক সাপ্তাহিক বোনাস বিতরণ করা হয়েছে। সফল ইউজারের সংখ্যা: ${details.length} জন, মোট বোনাস: ৳${totalDepositBonus + totalCashback}`,
        ipAddress: ip
      });
    }

    return NextResponse.json({
      success: true,
      message: `✅ সাপ্তাহিক বোনাস দেওয়া হয়েছে!`,
      summary: {
        totalUsers: details.length,
        totalSkipped: skipped.length,
        depositBonusCount,
        cashbackCount,
        totalDepositBonus,
        totalCashback,
        totalBonus: totalDepositBonus + totalCashback,
        weekKey: thisWeekKey,
        raceCaught,
        failedCount,
      },
      details,
      skipped,
    }, { status: 200 });

  } catch (error) {
    console.error('Weekly Bonus Error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার এরর: ' + error.message },
      { status: 500 }
    );
  }
}