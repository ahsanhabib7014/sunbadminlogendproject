
// // ..............................................................

// import { NextResponse } from 'next/server';
// import dbConnect from '@/utils/db';
// import Transaction from '@/models/Transaction';
// import User from '@/models/User';
// import { verifyAuth } from '@/utils/authCheck';

// export async function PUT(req) {
//   try {
//     await dbConnect();

//     // ১. সেন্ট্রালাইজড হাই-সিকিউরিটি অ্যাডমিন অথেন্টিকেশন চেক
//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ 
//         success: false, 
//         message: auth.message 
//       }, { status: auth.status });
//     }

//     const adminUser = auth.user;

//     const { transactionId, status } = await req.json();
    
//     if (!transactionId || !status) {
//       return NextResponse.json({ success: false, message: 'প্রয়োজনীয় তথ্য পাওয়া যায়নি।' }, { status: 400 });
//     }

//     const upperStatus = String(status).toUpperCase();

//     if (!['ACCEPTED', 'REJECTED'].includes(upperStatus)) {
//       return NextResponse.json({ success: false, message: 'সঠিক স্ট্যাটাস নির্বাচন করা হয়নি।' }, { status: 400 });
//     }

//     // ==========================================
//     // ✅✅✅ ATOMIC transaction status update
//     // শুধু PENDING থাকলে তবেই update হবে — double approve বন্ধ
//     // ==========================================
//     const tx = await Transaction.findOneAndUpdate(
//       { 
//         _id: transactionId, 
//         status: 'PENDING'   // ✅ শুধু PENDING থেকে update হবে
//       },
//       { $set: { status: upperStatus } },
//       { new: true }
//     );

//     if (!tx) {
//       // হয় ট্রানজেকশন নেই, হয় আগেই প্রসেস হয়েছে
//       const existing = await Transaction.findById(transactionId);
//       if (!existing) {
//         return NextResponse.json({ success: false, message: 'ট্রানজেকশন পাওয়া যায়নি' }, { status: 404 });
//       }
//       return NextResponse.json({ 
//         success: false, 
//         message: 'ট্রানজেকশন ইতোমধ্যে প্রসেস হয়েছে' 
//       }, { status: 409 });
//     }

//     // ✅ ATOMIC balance update (conditional)
//     const txType = String(tx.type).toUpperCase();
//     let balanceUpdate = null;

//     if (upperStatus === 'ACCEPTED' && txType === 'DEPOSIT') {
//       // ✅ Deposit accepted → balance + turnover যোগ
//       balanceUpdate = {
//         $inc: { 
//           balance: Number(tx.amount) || 0,
//           turnover: Number(tx.amount) || 0
//         }
//       };
//     } else if (upperStatus === 'REJECTED' && txType === 'WITHDRAW') {
//       // ✅ Withdraw rejected → balance refund
//       balanceUpdate = {
//         $inc: { balance: Number(tx.amount) || 0 }
//       };
//     }

//     if (balanceUpdate) {
//       const updatedUser = await User.findByIdAndUpdate(
//         tx.userId,
//         balanceUpdate,
//         { new: true }
//       );

//       if (!updatedUser) {
//         // ⚠️ Rare case: transaction status update হয়ে গেছে কিন্তু user নেই
//         console.error('User not found for transaction:', tx._id);
//       }
//     }
//     // ==========================================

//     return NextResponse.json({ 
//       success: true, 
//       message: `ট্রানজেকশন সফলভাবে ${upperStatus === 'ACCEPTED' ? 'গ্রহণ' : 'বাতিল'} করা হয়েছে` 
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Admin Transaction Update Error:', error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// /////////////////////////////////////////
import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { verifyAuth } from '@/utils/authCheck';
import AuditLog from '@/models/AuditLog'; // ✅ অডিট লগ মডেল ইমপোর্ট করা হলো

export async function PUT(req) {
  try {
    await dbConnect();

    // ১. সেন্ট্রালাইজড হাই-সিকিউরিটি অ্যাডমিন অথেন্টিকেশন চেক[cite: 10]
    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ 
        success: false, 
        message: auth.message 
      }, { status: auth.status });
    }

    const adminUser = auth.user; // ✅ সাব-অ্যাডমিন বা অ্যাডমিন ইউজার অবজেক্ট

    const { transactionId, status } = await req.json();
    
    if (!transactionId || !status) {
      return NextResponse.json({ success: false, message: 'প্রয়োজনীয় তথ্য পাওয়া যায়নি।' }, { status: 400 });
    }

    const upperStatus = String(status).toUpperCase();

    if (!['ACCEPTED', 'REJECTED'].includes(upperStatus)) {
      return NextResponse.json({ success: false, message: 'সঠিক স্ট্যাটাস নির্বাচন করা হয়নি।' }, { status: 400 });
    }

    // ==========================================
    // ✅✅✅ ATOMIC transaction status update
    // শুধু PENDING থাকলে তবেই update হবে — double approve বন্ধ
    // ==========================================
    const tx = await Transaction.findOneAndUpdate(
      { 
        _id: transactionId, 
        status: 'PENDING'   // ✅ শুধু PENDING থেকে update হবে
      },
      { $set: { status: upperStatus } },
      { new: true }
    );

    if (!tx) {
      // হয় ট্রানজেকশন নেই, হয় আগেই প্রসেস হয়েছে
      const existing = await Transaction.findById(transactionId);
      if (!existing) {
        return NextResponse.json({ success: false, message: 'ট্রানজেকশন পাওয়া যায়নি' }, { status: 404 });
      }
      return NextResponse.json({ 
        success: false, 
        message: 'ট্রানজেকশন ইতোমধ্যে প্রসেস হয়েছে' 
      }, { status: 409 });
    }

    // ✅ ATOMIC balance update (conditional)
    const txType = String(tx.type).toUpperCase();
    let balanceUpdate = null;

    if (upperStatus === 'ACCEPTED' && txType === 'DEPOSIT') {
      // ✅ Deposit accepted → balance + turnover যোগ
      balanceUpdate = {
        $inc: { 
          balance: Number(tx.amount) || 0,
          turnover: Number(tx.amount) || 0
        }
      };
    } else if (upperStatus === 'REJECTED' && txType === 'WITHDRAW') {
      // ✅ Withdraw rejected → balance refund[cite: 8, 10]
      balanceUpdate = {
        $inc: { balance: Number(tx.amount) || 0 }
      };
    }

    if (balanceUpdate) {
      const updatedUser = await User.findByIdAndUpdate(
        tx.userId,
        balanceUpdate,
        { new: true }
      );

      if (!updatedUser) {
        // ⚠️ Rare case: transaction status update হয়ে গেছে কিন্তু user নেই
        console.error('User not found for transaction:', tx._id);
      }
    }
    // ==========================================

    // ==========================================
    // ✅ সাব-অ্যাডমিন অ্যাকশনের অডিট লগ সেভ করা
    // ==========================================
    if (adminUser && adminUser.role === 'sub-admin') {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const actionName = txType === 'DEPOSIT' 
        ? (upperStatus === 'ACCEPTED' ? 'APPROVE_DEPOSIT_TX' : 'REJECT_DEPOSIT_TX')
        : (upperStatus === 'ACCEPTED' ? 'APPROVE_WITHDRAW_TX' : 'REJECT_WITHDRAW_TX');

      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: actionName,
        targetUser: tx.userId,
        details: `সাব-অ্যাডমিন (${adminUser.phone}) কর্তৃক ${tx.amount} টাকার ${txType} ট্রানজেকশনটি ${upperStatus === 'ACCEPTED' ? 'গ্রহণ (Accepted)' : 'বাতিল (Rejected)'} করা হয়েছে।`,
        ipAddress: ip
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `ট্রানজেকশন সফলভাবে ${upperStatus === 'ACCEPTED' ? 'গ্রহণ' : 'বাতিল'} করা হয়েছে` 
    }, { status: 200 });

  } catch (error) {
    console.error('Admin Transaction Update Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}