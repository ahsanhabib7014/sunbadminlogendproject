import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/utils/authCheck';
import { calculateVipLevel } from '@/utils/vipLevel';

export async function POST(req) {
  try {
    // ✅ Mongoose instance resolve
    const mongoose = await clientPromise;
    
    // ✅ Native MongoDB driver
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection পাওয়া যায়নি' },
        { status: 500 }
      );
    }

    // Admin auth
    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }

    const usersCollection = db.collection('users');
    const depositsCollection = db.collection('deposits');

    // সব user
    const users = await usersCollection.find({ role: 'user' }).toArray();

    const results = [];
    let updated = 0;

    for (const user of users) {
      // এই user-এর সব approved deposit
      const deposits = await depositsCollection.find({
        $or: [
          { uid: user.uid },
          { phone: user.phone },
          { userId: user._id.toString() },
          { userId: user._id },
        ],
        status: 'approved',
      }).toArray();

      // Total deposit
      const totalDeposit = deposits.reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      const newLevel = calculateVipLevel(totalDeposit);

      // যদি change লাগে
      if (
        totalDeposit !== (user.totalDeposit || 0) ||
        newLevel !== (user.vipLevel || 'none')
      ) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              totalDeposit,
              vipLevel: newLevel,
              vipLevelUpdatedAt: new Date(),
            },
          }
        );

        results.push({
          uid: user.uid,
          phone: user.phone,
          oldTotal: user.totalDeposit || 0,
          newTotal: totalDeposit,
          oldLevel: user.vipLevel || 'none',
          newLevel,
          depositCount: deposits.length,
        });
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${updated} জন user-এর VIP level update হয়েছে!`,
      totalUsers: users.length,
      updatedCount: updated,
      details: results,
    });

  } catch (error) {
    console.error('Fix VIP Error:', error);
    return NextResponse.json(
      { success: false, message: 'সার্ভার এরর: ' + error.message },
      { status: 500 }
    );
  }
}