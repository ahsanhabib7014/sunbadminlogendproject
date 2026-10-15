

// /////////////////////////////////////
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';
import Deposit from '@/models/Deposit';
import User from '@/models/User';
import Setting from '@/models/Setting';
import { verifyAuth } from '@/utils/authCheck';
import { calculateVipLevel } from '@/utils/vipLevel';
import AuditLog from '@/models/AuditLog';

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

export async function GET(request) {
  try {
    await clientPromise;

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    let deposits = await Deposit.find({}).lean();

    deposits = deposits.map(item => {
      let itemDate = item.createdAt || item.date || item.timestamp;

      if (!itemDate && item._id) {
        try {
          itemDate = new Date(parseInt(item._id.toString().substring(0, 8), 16) * 1000);
        } catch (e) {
          itemDate = new Date(0);
        }
      }

      return { ...item, createdAt: itemDate };
    });

    deposits.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, deposits }, { status: 200 });
  } catch (error) {
    console.error('Deposit GET Error');
    return NextResponse.json({ success: false, deposits: [], error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await clientPromise;

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const adminUser = auth.user;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
    }

    const { depositId, status, adminNote } = body || {};

    if (!depositId) {
      return NextResponse.json({ success: false, message: 'Deposit ID প্রয়োজন!' }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(depositId)) {
      return NextResponse.json({ success: false, message: 'Invalid deposit ID' }, { status: 400 });
    }

    const cleanNote = typeof adminNote === 'string' 
      ? adminNote.trim().slice(0, 500) 
      : '';

    if (!status) {
      const updatedDeposit = await Deposit.findByIdAndUpdate(
        depositId,
        { $set: { adminNote: cleanNote } },
        { returnDocument: 'after' }
      );

      if (!updatedDeposit) {
        return NextResponse.json({ success: false, message: 'Deposit not found' }, { status: 404 });
      }

      if (adminUser) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        await AuditLog.create({
          adminId: adminUser._id,
          adminPhone: adminUser.phone || adminUser.uid,
          action: 'UPDATE_DEPOSIT_NOTE',
          targetUser: updatedDeposit.uid || updatedDeposit.userId,
          oldData: { adminNote: updatedDeposit.adminNote },
          newData: { adminNote: cleanNote },
          details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) ডিপোজিটে নোট আপডেট করেছেন।`,
          ipAddress: ip
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: '✅ নোট সফলভাবে আপডেট হয়েছে!',
        deposit: updatedDeposit
      }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Status must be pending, approved, or rejected' 
      }, { status: 400 });
    }

    const existingDeposit = await Deposit.findById(depositId);
    if (!existingDeposit) {
      return NextResponse.json({ success: false, message: 'Deposit not found' }, { status: 404 });
    }

    // ট্রানজেকশন করার আগে ইউজারের আগের ব্যালেন্স বের করে রাখা
    const targetUserId = existingDeposit.uid || existingDeposit.userId;
    let oldUserBalance = 0;
    let newUserBalance = 0;

    if (targetUserId) {
      const targetUserDoc = await User.findOne({ uid: targetUserId });
      if (targetUserDoc) {
        oldUserBalance = targetUserDoc.balance || 0;
      }
    }

    const updateData = { status };
    if (cleanNote) updateData.adminNote = cleanNote;

    const updatedDeposit = await Deposit.findOneAndUpdate(
      { _id: depositId, status: 'pending' },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!updatedDeposit) {
      return NextResponse.json({ 
        success: false, 
        message: `এই ডিপোজিট ইতিমধ্যে ${existingDeposit.status} অবস্থায় আছে!` 
      }, { status: 409 });
    }

    if (status === 'approved') {
      const depositAmount = Number(updatedDeposit.amount) || 0;

      if (targetUserId && depositAmount > 0) {
        const user = await User.findOneAndUpdate(
          { uid: targetUserId },
          { 
            $inc: { 
              balance: depositAmount, 
              turnover: depositAmount,
              weeklyDeposit: depositAmount,
              monthlyTurnover: depositAmount,
              totalDeposit: depositAmount,
            } 
          },
         { returnDocument: 'after' }
        );

        if (user) {
          newUserBalance = user.balance || 0;
          const newLevel = calculateVipLevel(user.totalDeposit || 0);
          if (newLevel !== user.vipLevel) {
            await User.updateOne(
              { _id: user._id },
              { 
                $set: { 
                  vipLevel: newLevel,
                  vipLevelUpdatedAt: new Date(),
                } 
              }
            );
          }
        }

        if (user && user.referredBy) {
          try {
            const referrer = await User.findOne({ uid: user.referredBy });

            if (referrer) {
              let commissionRate = 10;

              if (referrer.customCommission !== null && referrer.customCommission !== undefined) {
                commissionRate = Number(referrer.customCommission);
              } else {
                const globalSetting = await Setting.findOne({ 
                  key: { $in: ['referralPercentage', 'defaultReferralCommission'] } 
                });
                
                if (globalSetting && globalSetting.value !== undefined) {
                  const parsed = Number(globalSetting.value);
                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    commissionRate = parsed;
                  }
                }
              }

              if (commissionRate < 0 || commissionRate > 100) {
                commissionRate = 10;
              }

              const commissionBonus = (depositAmount * commissionRate) / 100;

              if (commissionBonus > 0) {
                await User.updateOne(
                  { uid: referrer.uid },
                  { $inc: { referralBalance: commissionBonus } }
                );
              }
            }
          } catch (refErr) {
            console.error('Referral commission error');
          }
        }
      }
    } else {
      newUserBalance = oldUserBalance; // রিজেক্ট হলে ব্যালেন্স একই থাকে
    }

    if (adminUser) {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: status === 'approved' ? 'APPROVE_DEPOSIT' : 'REJECT_DEPOSIT',
        targetUser: targetUserId,
        oldData: {
          depositId: existingDeposit._id,
          amount: existingDeposit.amount,
          status: existingDeposit.status,
          balance: oldUserBalance
        },
        newData: {
          depositId: updatedDeposit._id,
          amount: updatedDeposit.amount,
          status: updatedDeposit.status,
          balance: newUserBalance
        },
        details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক ${updatedDeposit.amount} টাকা ডিপোজিট ${status === 'approved' ? 'এপ্রুভ করা হয়েছে। ইউজারের ব্যালেন্স ৳${oldUserBalance} থেকে বেড়ে ৳${newUserBalance} হয়েছে।' : 'বাতিল করা হয়েছে।'}`,
        ipAddress: ip
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'approved' 
        ? 'ডিপোজিট কনফার্ম হয়েছে এবং ব্যালেন্স যোগ করা হয়েছে' 
        : 'ডিপোজিট বাতিল করা হয়েছে',
      deposit: updatedDeposit
    }, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });

  } catch (error) {
    console.error('Deposit PATCH Error', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}