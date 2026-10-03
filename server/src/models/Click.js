import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
  url: { type: mongoose.Schema.Types.ObjectId, ref: 'Url', required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  referrer: { type: String, maxlength: 500, default: '' },
  userAgent: { type: String, maxlength: 500, default: '' },
  ipHash: { type: String, select: false, default: '' }
}, { timestamps: false });

clickSchema.index({ url: 1, timestamp: -1 });
export default mongoose.model('Click', clickSchema);
