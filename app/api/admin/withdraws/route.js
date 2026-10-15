

// /////////////////////////////////////////////////////////////////////////

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import Withdraw from '@/models/Withdraw';
import User from '@/models/User';
import { verifyAuth } from '@/utils/authCheck';
import AuditLog from '@/models/AuditLog';

const calculateRefundAmount = (withdraw) => {
  if (withdraw.deductedBDT && Number(withdraw.deductedBDT) > 0) {
    return Number(withdraw.deductedBDT);
  }
  if (withdraw.originalCurrency === 'USD' && withdraw.exchangeRate && Number(withdraw.exchangeRate) > 0) {
    return Math.round(Number(withdraw.amount) * Number(withdraw.exchangeRate));
  }
  return Number(withdraw.amount) || 0;
};

// ✅ সাব-অ্যাডমিন বা অ্যাডমিন ভেরিফিকেশনের জন্য হেলপার ফাংশন
const checkAdminAuth = async () => {
  try {
    const auth = await verifyAuth('admin');
    if (auth.success && auth.user) {
      const role = auth.user.role;
      if (role === 'admin' || role === 'sub-admin') {
        return { success: true, user: auth.user };
      }
    }
  } catch (e) {
    // ignore
  }
  return { success: false, message: 'অনুমোদিত নয়! দয়া করে আবার লগইন করুন।' };
};

export async function GET(request) {
  try {
    await clientPromise;
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: 401 });
    }

    let withdraws = await Withdraw.find({}).lean();
    withdraws.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json({ success: true, withdraws }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, withdraws: [], error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await clientPromise;

    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: 401 });
    }

    const adminUser = authCheck.user;

    let body;
    try { body = await request.json(); } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const { withdrawId, status, adminNote } = body || {};
    if (!withdrawId) {
      return NextResponse.json({ success: false, message: 'Withdraw ID প্রয়োজন!' }, { status: 400 });
    }

    const cleanNote = typeof adminNote === 'string' ? adminNote.trim().slice(0, 200) : '';

    if (!status) {
      const existingWithdraw = await Withdraw.findById(withdrawId);
      const updated = await Withdraw.findByIdAndUpdate(
        withdrawId, { $set: { adminNote: cleanNote } }, { returnDocument: 'after' }
      );

      if (adminUser && updated) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await AuditLog.create({
          adminId: adminUser._id,
          adminPhone: adminUser.phone || adminUser.uid,
          action: 'UPDATE_WITHDRAW_NOTE',
          targetUser: updated.uid || updated.userId,
          oldData: { adminNote: existingWithdraw?.adminNote || '' },
          newData: { adminNote: cleanNote },
          details: `${adminUser.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'অ্যাডমিন'} (${adminUser.phone || adminUser.uid}) উইথড্রতে নোট আপডেট করেছেন।`,
          ipAddress: ip
        });
      }

      return NextResponse.json({ success: true, message: '✅ নোট আপডেট হয়েছে!', withdraw: updated }, { status: 200 });
    }

    const existingWithdraw = await Withdraw.findById(withdrawId);
    if (!existingWithdraw) {
      return NextResponse.json({ success: false, message: 'Withdraw not found' }, { status: 404 });
    }

    const targetUserId = existingWithdraw.uid || existingWithdraw.userId;
    let oldUserBalance = 0;
    let newUserBalance = 0;
    const walletType = existingWithdraw.walletType || 'main';
    const balanceField = walletType === 'referral' ? 'referralBalance' : 'balance';

    if (targetUserId) {
      const targetUserDoc = await User.findOne({ uid: targetUserId });
      if (targetUserDoc) {
        oldUserBalance = targetUserDoc[balanceField] || 0;
      }
    }

    const updateData = { status };
    if (cleanNote) updateData.adminNote = cleanNote;

    const updatedWithdraw = await Withdraw.findOneAndUpdate(
      { _id: withdrawId, status: 'pending' },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedWithdraw) {
      return NextResponse.json({ success: false, message: `ইতিমধ্যে ${existingWithdraw.status} অবস্থায় আছে` }, { status: 409 });
    }

    let refundInfo = null;

    if (status === 'rejected') {
      const refundAmount = calculateRefundAmount(updatedWithdraw);

      if (targetUserId && refundAmount > 0) {
        const updatedUser = await User.findOneAndUpdate(
          { uid: targetUserId },
          { $inc: { [balanceField]: refundAmount } },
         { returnDocument: 'after' }
        );

        if (updatedUser) {
          newUserBalance = updatedUser[balanceField] || 0;
          refundInfo = {
            refundAmount,
            newBalance: updatedUser.balance,
            newReferralBalance: updatedUser.referralBalance
          };
        }
      }
    } else {
      newUserBalance = oldUserBalance;
    }

    if (adminUser) {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const actionType = status === 'approved' ? 'APPROVE_WITHDRAW' : (status === 'rejected' ? 'REJECT_WITHDRAW' : 'UPDATE_WITHDRAW');
      const roleText = adminUser.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'অ্যাডমিন';
      
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: actionType,
        targetUser: targetUserId,
        oldData: {
          withdrawId: existingWithdraw._id,
          amount: existingWithdraw.amount,
          status: existingWithdraw.status,
          [balanceField]: oldUserBalance
        },
        newData: {
          withdrawId: updatedWithdraw._id,
          amount: updatedWithdraw.amount,
          status: updatedWithdraw.status,
          [balanceField]: newUserBalance
        },
        details: `${roleText} (${adminUser.phone || adminUser.uid}) কর্তৃক ${updatedWithdraw.amount} টাকার উইথড্র ${status === 'approved' ? 'এপ্রুভ করা হয়েছে।' : `বাতিল ও ৳${refundInfo?.refundAmount || 0} রিফান্ড করা হয়েছে। ইউজারের ব্যালেন্স ৳${oldUserBalance} থেকে বেড়ে ৳${newUserBalance} হয়েছে।`}`,
        ipAddress: ip
      });
    }

    return NextResponse.json({
      success: true,
      message: status === 'rejected'
        ? `✅ উইথড্র বাতিল হয়েছে এবং ৳${refundInfo?.refundAmount || 0} ফেরত দেওয়া হয়েছে`
        : '✅ উইথড্র কনফার্ম হয়েছে',
      withdraw: updatedWithdraw,
      refundInfo
    }, { status: 200 });

  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await clientPromise;
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return NextResponse.json({ success: false, message: authCheck.message }, { status: 401 });
    }

    const adminUser = authCheck.user;

    const { withdrawId, action } = await request.json();
    if (!withdrawId || !action) {
      return NextResponse.json({ success: false, message: 'প্রয়োজনীয় তথ্য নেই' }, { status: 400 });
    }

    const withdraw = await Withdraw.findById(withdrawId);
    if (!withdraw || withdraw.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'পাওয়া যায়নি বা প্রসেস হয়েছে' }, { status: 400 });
    }

    const oldStatus = withdraw.status;
    const targetUserId = withdraw.uid || withdraw.userId;
    const walletType = withdraw.walletType || 'main';
    const balanceField = walletType === 'referral' ? 'referralBalance' : 'balance';

    let oldUserBalance = 0;
    let newUserBalance = 0;

    if (targetUserId) {
      const userDoc = await User.findOne({ uid: targetUserId });
      if (userDoc) {
        oldUserBalance = userDoc[balanceField] || 0;
      }
    }

    const roleText = adminUser.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'অ্যাডমিন';

    if (action === 'approve') {
      withdraw.status = 'approved';
      await withdraw.save();
      newUserBalance = oldUserBalance;

      if (adminUser) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await AuditLog.create({
          adminId: adminUser._id,
          adminPhone: adminUser.phone || adminUser.uid,
          action: 'APPROVE_WITHDRAW',
          targetUser: targetUserId,
          oldData: {
            withdrawId: withdraw._id,
            amount: withdraw.amount,
            status: oldStatus,
            [balanceField]: oldUserBalance
          },
          newData: {
            withdrawId: withdraw._id,
            amount: withdraw.amount,
            status: withdraw.status,
            [balanceField]: newUserBalance
          },
          details: `${roleText} (${adminUser.phone || adminUser.uid}) কর্তৃক ${withdraw.amount} টাকার উইথড্র এপ্রুভ করা হয়েছে।`,
          ipAddress: ip
        });
      }

      return NextResponse.json({ success: true, message: '✅ অ্যাপ্রুভ' }, { status: 200 });
    }

    if (action === 'reject') {
      withdraw.status = 'rejected';
      await withdraw.save();

      const refundAmount = calculateRefundAmount(withdraw);
      let refundInfo = null;

      if (refundAmount > 0 && targetUserId) {
        const updatedUser = await User.findOneAndUpdate(
          { uid: targetUserId },
          { $inc: { [balanceField]: refundAmount } },
         { returnDocument: 'after' }
        );
        if (updatedUser) {
          newUserBalance = updatedUser[balanceField] || 0;
          refundInfo = {
            refundAmount,
            newBalance: updatedUser.balance,
            newReferralBalance: updatedUser.referralBalance
          };
        }
      }

      if (adminUser) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await AuditLog.create({
          adminId: adminUser._id,
          adminPhone: adminUser.phone || adminUser.uid,
          action: 'REJECT_WITHDRAW',
          targetUser: targetUserId,
          oldData: {
            withdrawId: withdraw._id,
            amount: withdraw.amount,
            status: oldStatus,
            [balanceField]: oldUserBalance
          },
          newData: {
            withdrawId: withdraw._id,
            amount: withdraw.amount,
            status: withdraw.status,
            [balanceField]: newUserBalance
          },
          details: `${roleText} (${adminUser.phone || adminUser.uid}) কর্তৃক ${withdraw.amount} টাকার উইথড্র বাতিল ও ৳${refundAmount} রিফান্ড করা হয়েছে। ইউজারের ব্যালেন্স ৳${oldUserBalance} থেকে বেড়ে ৳${newUserBalance} হয়েছে।`,
          ipAddress: ip
        });
      }

      return NextResponse.json({
        success: true,
        message: `✅ ৳${refundAmount} রিফান্ড`,
        refundInfo
      }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'ভুল action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}