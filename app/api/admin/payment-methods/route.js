// // // import { NextResponse } from 'next/server';
// // // import dbConnect from '@/utils/db';
// // // import PaymentMethod from '@/models/PaymentMethod';
// // // import User from '@/models/User';
// // // import { verifyAuth } from '@/utils/authCheck';

// // // // GET: মেথড ফেচ করা (অ্যাডমিন সব দেখবে, সাধারণ ইউজার শুধু সচল মেথডগুলো দেখবে)
// // // export async function GET(req) {
// // //   try {
// // //     await dbConnect();

// // //     // সাধারণ অথেন্টিকেশন চেক (লগইন করা আছে কি না)
// // //     const auth = await verifyAuth();
// // //     if (!auth.success) {
// // //       return NextResponse.json({ success: false, message: 'দয়া করে প্রথমে লগইন করুন!' }, { status: 401 });
// // //     }

// // //     let methods;
// // //     // যদি ইউজার অ্যাডমিন হয়, তবে সব মেথড দেখাবে
// // //     if (auth.user && auth.user.role === 'admin') {
// // //       methods = await PaymentMethod.find({}).sort({ createdAt: -1 });
// // //     } else {
// // //       // সাধারণ ইউজারের জন্য শুধু সচল (Active) মেথডগুলো ফিল্টার করে পাঠানো হবে
// // //       methods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
// // //     }

// // //     return NextResponse.json({ success: true, methods }, { status: 200 });
// // //   } catch (error) {
// // //     console.error('Get Payment Methods Error:', error);
// // //     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
// // //   }
// // // }

// // // // POST: নতুন মেথডের নাম যোগ করা (শুধুমাত্র অ্যাডমিন)
// // // export async function POST(req) {
// // //   try {
// // //     await dbConnect();

// // //     const auth = await verifyAuth('admin');
// // //     if (!auth.success) {
// // //       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
// // //     }

// // //     const body = await req.json();
// // //     const { methodName } = body;

// // //     if (!methodName || !methodName.trim()) {
// // //       return NextResponse.json({ success: false, message: 'মেথডের নাম আবশ্যক!' }, { status: 400 });
// // //     }

// // //     const cleanName = methodName.trim();

// // //     // চেক করা নাম ইতিমধ্যে আছে কি না
// // //     const existing = await PaymentMethod.findOne({ methodName: new RegExp(`^${cleanName}$`, 'i') });
// // //     if (existing) {
// // //       return NextResponse.json({ success: false, message: 'এই নামের পেমেন্ট মেথড ইতিমধ্যে রয়েছে!' }, { status: 400 });
// // //     }

// // //     const newMethod = await PaymentMethod.create({
// // //       methodName: cleanName,
// // //       isActive: true
// // //     });

// // //     return NextResponse.json({ success: true, message: 'পেমেন্ট মেথড সফলভাবে যোগ করা হয়েছে!', method: newMethod }, { status: 201 });
// // //   } catch (error) {
// // //     console.error('Create Payment Method Error:', error);
// // //     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
// // //   }
// // // }

// // // // PUT: অন/অফ (Toggle Status) করার জন্য (শুধুমাত্র অ্যাডমিন)
// // // export async function PUT(req) {
// // //   try {
// // //     await dbConnect();

// // //     const auth = await verifyAuth('admin');
// // //     if (!auth.success) {
// // //       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
// // //     }

// // //     const body = await req.json();
// // //     const { id, isActive } = body;

// // //     if (!id) {
// // //       return NextResponse.json({ success: false, message: 'আইডি পাওয়া যায়নি!' }, { status: 400 });
// // //     }

// // //     const updatedMethod = await PaymentMethod.findByIdAndUpdate(
// // //       id,
// // //       { isActive },
// // //       { new: true }
// // //     );

// // //     if (!updatedMethod) {
// // //       return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
// // //     }

// // //     return NextResponse.json({ 
// // //       success: true, 
// // //       message: `মেথডটি সফলভাবে ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে!`, 
// // //       method: updatedMethod 
// // //     }, { status: 200 });
// // //   } catch (error) {
// // //     console.error('Update Payment Method Error:', error);
// // //     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
// // //   }
// // // }

// // // // DELETE: ডিলিট করার জন্য (শুধুমাত্র অ্যাডমিন)
// // // export async function DELETE(req) {
// // //   try {
// // //     await dbConnect();

// // //     const auth = await verifyAuth('admin');
// // //     if (!auth.success) {
// // //       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
// // //     }

// // //     const { searchParams } = new URL(req.url);
// // //     const id = searchParams.get('id');

// // //     if (!id) {
// // //       return NextResponse.json({ success: false, message: 'আইডি প্রয়োজন!' }, { status: 400 });
// // //     }

// // //     const deleted = await PaymentMethod.findByIdAndDelete(id);
// // //     if (!deleted) {
// // //       return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
// // //     }

// // //     return NextResponse.json({ success: true, message: 'পেমেন্ট মেথড সফলভাবে ডিলিট করা হয়েছে!' }, { status: 200 });
// // //   } catch (error) {
// // //     console.error('Delete Payment Method Error:', error);
// // //     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
// // //   }
// // // }

// // // /////////////////////////////////////////////////

// // // ///////////////////////////////////////////////////////////////
// // import { NextResponse } from 'next/server';
// // import dbConnect from '@/utils/db';
// // import Setting from '@/models/Setting';
// // import { verifyAuth } from '@/utils/authCheck';
// // import AuditLog from '@/models/AuditLog'; // ✅ অডিট লগ মডেল ইমপোর্ট করা হলো

// // const DEFAULT_RATE = 120;

// // // GET: Current rate (লগইন করা ইউজার এবং অ্যাডমিন উভয়ই রিড করতে পারবে)
// // export async function GET(req) {
// //   try {
// //     await dbConnect();

// //     // এখানে verifyAuth() ব্যবহার করা হয়েছে যাতে যেকোনো লগইন করা ইউজার (ইউজার বা অ্যাডমিন) রেটটি দেখতে পারে[cite: 10]
// //     const auth = await verifyAuth(); 
// //     if (!auth.success) {
// //       return NextResponse.json({ success: false, message: auth.message || 'অনুমতি নেই!' }, { status: auth.status || 401 });
// //     }

// //     const setting = await Setting.findOne({ key: 'usdToBdtRate' });
// //     const rate = setting?.value || DEFAULT_RATE;

// //     return NextResponse.json({ 
// //       success: true, 
// //       rate: Number(rate),
// //       updatedAt: setting?.updatedAt || null,
// //       source: setting ? 'database' : 'default'
// //     }, { status: 200 });

// //   } catch (error) {
// //     console.error('Exchange Rate GET Error:', error);
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: 'সার্ভার এরর!',
// //       rate: DEFAULT_RATE
// //     }, { status: 500 });
// //   }
// // }

// // // POST: Update rate (এটি আগের মতোই শুধু অ্যাডমিনের জন্য সুরক্ষিত থাকবে)[cite: 10]
// // export async function POST(req) {
// //   try {
// //     await dbConnect();

// //     const auth = await verifyAuth('admin');
// //     if (!auth.success) {
// //       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
// //     }

// //     const adminUser = auth.user; // ✅ সাব-অ্যাডমিন বা অ্যাডমিন ইউজার অবজেক্ট

// //     let body;
// //     try {
// //       body = await req.json();
// //     } catch (e) {
// //       return NextResponse.json({ success: false, message: 'অবৈধ ডেটা!' }, { status: 400 });
// //     }

// //     const { rate } = body || {};
// //     const parsedRate = Number(rate);

// //     if (isNaN(parsedRate) || parsedRate <= 0) {
// //       return NextResponse.json({ 
// //         success: false, 
// //         message: 'সঠিক rate দিন (ধনাত্মক সংখ্যা)!' 
// //       }, { status: 400 });
// //     }

// //     if (parsedRate < 50 || parsedRate > 500) {
// //       return NextResponse.json({ 
// //         success: false, 
// //         message: 'Rate অবশ্যই ৫০ থেকে ৫০০ এর মধ্যে হতে হবে!' 
// //       }, { status: 400 });
// //     }

// //     const updated = await Setting.findOneAndUpdate(
// //       { key: 'usdToBdtRate' },
// //       { value: parsedRate },
// //       { upsert: true, new: true }
// //     );

// //     // ==========================================
// //     // ✅ সাব-অ্যাডমিন অ্যাকশনের অডিট লগ সেভ করা
// //     // ==========================================
// //     if (adminUser && adminUser.role === 'sub-admin') {
// //       const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
// //       await AuditLog.create({
// //         adminId: adminUser._id,
// //         adminPhone: adminUser.phone || adminUser.uid,
// //         action: 'UPDATE_EXCHANGE_RATE',
// //         targetUser: 'SYSTEM_SETTINGS',
// //         details: `সাব-অ্যাডমিন (${adminUser.phone}) কর্তৃক ইউএসডি এক্সচেঞ্জ রেট পরিবর্তন করে ৳${parsedRate} করা হয়েছে।`,
// //         ipAddress: ip
// //       });
// //     }

// //     return NextResponse.json({ 
// //       success: true, 
// //       message: `✅ Exchange rate সফলভাবে ৳${parsedRate} এ আপডেট হয়েছে!`,
// //       rate: parsedRate,
// //       updatedAt: updated.updatedAt
// //     }, { status: 200 });

// //   } catch (error) {
// //     console.error('Exchange Rate POST Error:', error);
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: 'সার্ভার এরর!' 
// //     }, { status: 500 });
// //   }
// // }

// // ///////////////////////////////////////
//       import { NextResponse } from 'next/server';
// import dbConnect from '@/utils/db';
// import PaymentMethod from '@/models/PaymentMethod';
// import { verifyAuth } from '@/utils/authCheck';
// import AuditLog from '@/models/AuditLog';

// // GET: পেমেন্ট মেথডগুলো ফেচ করা
// export async function GET(req) {
//   try {
//     await dbConnect();

//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
//     }

//     const methods = await PaymentMethod.find({}).sort({ createdAt: -1 });

//     return NextResponse.json({ 
//       success: true, 
//       methods: Array.isArray(methods) ? methods : [] 
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Get Payment Methods Error:', error);
//     return NextResponse.json({ success: false, methods: [], message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
//   }
// }

// // POST: নতুন পেমেন্ট মেথড যোগ করা
// export async function POST(req) {
//   try {
//     await dbConnect();

//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
//     }

//     const adminUser = auth.user;
//     const body = await req.json();
//     const { methodName } = body;

//     if (!methodName || !methodName.trim()) {
//       return NextResponse.json({ success: false, message: 'মেথডের নাম আবশ্যক!' }, { status: 400 });
//     }

//     const cleanName = methodName.trim();

//     const existing = await PaymentMethod.findOne({ methodName: new RegExp(`^${cleanName}$`, 'i') });
//     if (existing) {
//       return NextResponse.json({ success: false, message: 'এই নামের পেমেন্ট মেথড ইতিমধ্যে রয়েছে!' }, { status: 400 });
//     }

//     const newMethod = await PaymentMethod.create({
//       methodName: cleanName,
//       isActive: true
//     });

//     if (adminUser) {
//       const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
//       await AuditLog.create({
//         adminId: adminUser._id,
//         adminPhone: adminUser.phone || adminUser.uid,
//         action: 'CREATE_PAYMENT_METHOD',
//         targetUser: 'PAYMENT_METHOD',
//         oldData: {},
//         newData: { methodName: cleanName },
//         details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক নতুন পেমেন্ট মেথড (${cleanName}) যুক্ত করা হয়েছে।`,
//         ipAddress: ip
//       });
//     }

//     return NextResponse.json({ 
//       success: true, 
//       message: 'পেমেন্ট মেথড সফলভাবে যোগ করা হয়েছে!', 
//       method: newMethod 
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Create Payment Method Error:', error);
//     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
//   }
// }

// // PUT: স্ট্যাটাস অন/অফ করা
// export async function PUT(req) {
//   try {
//     await dbConnect();

//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
//     }

//     const adminUser = auth.user;
//     const body = await req.json();
//     const { id, isActive } = body;

//     if (!id) {
//       return NextResponse.json({ success: false, message: 'আইডি পাওয়া যায়নি!' }, { status: 400 });
//     }

//     const existing = await PaymentMethod.findById(id);
//     if (!existing) {
//       return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
//     }

//     const updatedMethod = await PaymentMethod.findByIdAndUpdate(
//       id,
//       { isActive },
//       { new: true }
//     );

//     if (adminUser) {
//       const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
//       await AuditLog.create({
//         adminId: adminUser._id,
//         adminPhone: adminUser.phone || adminUser.uid,
//         action: 'UPDATE_PAYMENT_METHOD',
//         targetUser: 'PAYMENT_METHOD',
//         oldData: { id: existing._id, isActive: existing.isActive },
//         newData: { id: updatedMethod._id, isActive: updatedMethod.isActive },
//         details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক পেমেন্ট মেথড (${updatedMethod.methodName}) স্ট্যাটাস ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে।`,
//         ipAddress: ip
//       });
//     }

//     return NextResponse.json({ 
//       success: true, 
//       message: `মেথডটি সফলভাবে ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে!`, 
//       method: updatedMethod 
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Update Payment Method Error:', error);
//     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
//   }
// }

// // DELETE: ডিলিট করা
// export async function DELETE(req) {
//   try {
//     await dbConnect();

//     const auth = await verifyAuth('admin');
//     if (!auth.success) {
//       return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
//     }

//     const adminUser = auth.user;
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get('id');

//     if (!id) {
//       return NextResponse.json({ success: false, message: 'আইডি প্রয়োজন!' }, { status: 400 });
//     }

//     const deleted = await PaymentMethod.findByIdAndDelete(id);
//     if (!deleted) {
//       return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
//     }

//     if (adminUser) {
//       const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
//       await AuditLog.create({
//         adminId: adminUser._id,
//         adminPhone: adminUser.phone || adminUser.uid,
//         action: 'DELETE_PAYMENT_METHOD',
//         targetUser: 'PAYMENT_METHOD',
//         oldData: { id: deleted._id, methodName: deleted.methodName },
//         newData: { status: 'deleted' },
//         details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক পেমেন্ট মেথড (${deleted.methodName}) ডিলিট করা হয়েছে।`,
//         ipAddress: ip
//       });
//     }

//     return NextResponse.json({ 
//       success: true, 
//       message: 'পেমেন্ট মেথড সফলভাবে ডিলিট করা হয়েছে!' 
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Delete Payment Method Error:', error);
//     return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
//   }
// }

// ////////////////////////////////////////////////////////////////////

import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import PaymentMethod from '@/models/PaymentMethod';
import { verifyAuth } from '@/utils/authCheck';
import AuditLog from '@/models/AuditLog';

// GET: পেমেন্ট মেথডগুলো ফেচ করা (রোলভিত্তিক নিরাপদ ফিল্টারিং)
export async function GET(req) {
  try {
    await dbConnect();

    // অ্যাডমিন বা সাব-অ্যাডমিনের অথেন্টিকেশন চেক করা
    const auth = await verifyAuth('admin');
    
    let methods;

    // যদি সফলভাবে অ্যাডমিন বা সাব-অ্যাডমিন ভেরিফাই হয়
    if (auth.success && auth.user) {
      const userRole = auth.user.role;
      
      // সুনির্দিষ্টভাবে রোল চেক (সুপার অ্যাডমিন অথবা সাব-অ্যাডমিন)
      if (userRole === 'admin' || userRole === 'sub-admin') {
        // এরা প্যানেল থেকে সব মেথড (Active এবং Inactive উভয়ই) দেখতে পাবে
        methods = await PaymentMethod.find({}).sort({ createdAt: -1 });
      } else {
        // অন্য কেউ হলে শুধু সচল মেথড দেখবে
        methods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
      }
    } else {
      // সাধারণ ইউজার বা লগইন ছাড়া ভিজিটর হলে শুধুমাত্র সচল (Active) মেথডগুলো পাবে
      methods = await PaymentMethod.find({ isActive: true }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ 
      success: true, 
      methods: Array.isArray(methods) ? methods : [] 
    }, { status: 200 });

  } catch (error) {
    console.error('Get Payment Methods Error:', error);
    return NextResponse.json({ success: false, methods: [], message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}

// POST: নতুন পেমেন্ট মেথড যোগ করা
export async function POST(req) {
  try {
    await dbConnect();

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const adminUser = auth.user;
    const body = await req.json();
    const { methodName } = body;

    if (!methodName || !methodName.trim()) {
      return NextResponse.json({ success: false, message: 'মেথডের নাম আবশ্যক!' }, { status: 400 });
    }

    const cleanName = methodName.trim();

    const existing = await PaymentMethod.findOne({ methodName: new RegExp(`^${cleanName}$`, 'i') });
    if (existing) {
      return NextResponse.json({ success: false, message: 'এই নামের পেমেন্ট মেথড ইতিমধ্যে রয়েছে!' }, { status: 400 });
    }

    const newMethod = await PaymentMethod.create({
      methodName: cleanName,
      isActive: true
    });

    if (adminUser) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: 'CREATE_PAYMENT_METHOD',
        targetUser: 'PAYMENT_METHOD',
        oldData: {},
        newData: { methodName: cleanName },
        details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক নতুন পেমেন্ট মেথড (${cleanName}) যুক্ত করা হয়েছে।`,
        ipAddress: ip
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'পেমেন্ট মেথড সফলভাবে যোগ করা হয়েছে!', 
      method: newMethod 
    }, { status: 201 });

  } catch (error) {
    console.error('Create Payment Method Error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}

// PUT: স্ট্যাটাস অন/অফ করা
export async function PUT(req) {
  try {
    await dbConnect();

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const adminUser = auth.user;
    const body = await req.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'আইডি পাওয়া যায়নি!' }, { status: 400 });
    }

    const existing = await PaymentMethod.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
    }

    const updatedMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (adminUser) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: 'UPDATE_PAYMENT_METHOD',
        targetUser: 'PAYMENT_METHOD',
        oldData: { id: existing._id, isActive: existing.isActive },
        newData: { id: updatedMethod._id, isActive: updatedMethod.isActive },
        details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক পেমেন্ট মেথড (${updatedMethod.methodName}) স্ট্যাটাস ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে।`,
        ipAddress: ip
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `মেথডটি সফলভাবে ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে!`, 
      method: updatedMethod 
    }, { status: 200 });

  } catch (error) {
    console.error('Update Payment Method Error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}

// DELETE: ডিলিট করা
export async function DELETE(req) {
  try {
    await dbConnect();

    const auth = await verifyAuth('admin');
    if (!auth.success) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    const adminUser = auth.user;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'আইডি প্রয়োজন!' }, { status: 400 });
    }

    const deleted = await PaymentMethod.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'পেমেন্ট মেথড পাওয়া যায়নি!' }, { status: 404 });
    }

    if (adminUser) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await AuditLog.create({
        adminId: adminUser._id,
        adminPhone: adminUser.phone || adminUser.uid,
        action: 'DELETE_PAYMENT_METHOD',
        targetUser: 'PAYMENT_METHOD',
        oldData: { id: deleted._id, methodName: deleted.methodName },
        newData: { status: 'deleted' },
        details: `অ্যাডমিন (${adminUser.phone || adminUser.uid}) কর্তৃক পেমেন্ট মেথড (${deleted.methodName}) ডিলিট করা হয়েছে।`,
        ipAddress: ip
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'পেমেন্ট মেথড সফলভাবে ডিলিট করা হয়েছে!' 
    }, { status: 200 });

  } catch (error) {
    console.error('Delete Payment Method Error:', error);
    return NextResponse.json({ success: false, message: 'সার্ভার ত্রুটি ঘটেছে!' }, { status: 500 });
  }
}