import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['BORROW', 'RETURN', 'INFO'],
      default: 'INFO',
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    studentName: {
      type: String,
      trim: true,
    },
    bookTitle: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
