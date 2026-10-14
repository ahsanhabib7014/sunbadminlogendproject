import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { verifyAuth } from '@/utils/authCheck';

// ১. ইউজার সার্চ করার জন্য GET এপিআই
export async function GET(req) {
  try {
    await dbConnect();
    
    // সুপার অ্যাডমিন অথেন্টিকেশন চেক
    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ success: false, message: 'অনুগ্রহ করে ইউজার আইডি বা ফোন নম্বর দিন।' }, { status: 400 });
    }

    // UID অথবা Phone দিয়ে ইউজার খোঁজা
    const users = await User.find({
      $or: [
        { uid: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('uid phone role permissions');

    return NextResponse.json({ success: true, users }, { status: 200 });

  } catch (error) {
    console.error('Search User Error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার অভ্যন্তরীণ ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}

// ২. ইউজারের রোল ও পারমিশন আপডেট করার জন্য PUT এপিআই
export async function PUT(req) {
  try {
    await dbConnect();
    
    // সুপার অ্যাডমিন অথেন্টিকেশন চেক
    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const { userId, role, permissions } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'ইউজার আইডি পাওয়া যায়নি!' }, { status: 400 });
    }

    // ডাটাবেজে ইউজার আপডেট করা
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, permissions },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'ইউজার ডাটাবেজে খুঁজে পাওয়া যায়নি!' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'পারমিশন সফলভাবে আপডেট করা হয়েছে!', 
      user: updatedUser 
    }, { status: 200 });

  } catch (error) {
    console.error('Update Permission Error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার অভ্যন্তরীণ ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}