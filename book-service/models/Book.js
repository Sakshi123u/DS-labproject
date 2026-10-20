import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
      default: 1,
    },
    totalQuantity: {
      type: Number,
      min: [1, 'Total quantity must be at least 1'],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for title and author searching
bookSchema.index({ title: 'text', author: 'text' });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
