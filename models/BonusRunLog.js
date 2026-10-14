import mongoose from 'mongoose';

const BonusRunLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true,
    index: true,
  },
  periodKey: {
    type: String,
    required: true,
    index: true,
  },
  summary: {
    totalGiven: Number,
    totalSkipped: Number,
    totalAmount: Number,

    depositBonusCount: Number,
    cashbackCount: Number,
    totalDepositBonus: Number,
    totalCashback: Number,

    totalWinners: Number,
    totalBonus: Number,

    raceCaught: Number,
    failedCount: Number,
    durationMs: Number,
  },
  given: [
    {
      uid: String,
      phone: String,
      rank: Number,
      amount: Number,
      bonuses: [
        {
          type: String,
          amount: Number,
          turnover: Number,
        }
      ],
      turnover: Number,
      monthlyCashback: Number,
    }
  ],
  skipped: [
    {
      uid: String,
      phone: String,
      reason: String,
      weeklyDeposit: Number,
      weeklyLost: Number,
      monthlyCashback: Number,
    }
  ],
  runBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  runAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

export default mongoose.models.BonusRunLog ||
  mongoose.model('BonusRunLog', BonusRunLogSchema);