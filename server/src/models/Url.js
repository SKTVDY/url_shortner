import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true, index: true },
  isCustomAlias: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clicks: { type: Number, default: 0 },
  lastClickedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

urlSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Url', urlSchema);
