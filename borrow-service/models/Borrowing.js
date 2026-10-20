import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    bookId: {
      type: String,
      required: [true, 'Book ID is required'],
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['BORROWED', 'RETURNED'],
      default: 'BORROWED',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Borrowing || mongoose.model('Borrowing', borrowingSchema);
