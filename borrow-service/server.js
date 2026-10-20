import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';
import BorrowingModel from './models/Borrowing.js';

const app = express();
const PORT = process.env.BORROW_PORT || process.env.BORROW_SERVICE_PORT || 4002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/libraflow';
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Sample initial borrowing records
let inMemoryBorrowings = [
  {
    _id: 'borrow-201',
    studentName: 'Alex Johnson',
    bookId: 'book-104',
    bookTitle: 'Computer Networking: A Top-Down Approach',
    borrowDate: new Date('2026-10-10T09:00:00Z'),
    returnDate: new Date('2026-10-18T14:30:00Z'),
    status: 'RETURNED',
  },
  {
    _id: 'borrow-202',
    studentName: 'Priya Sharma',
    bookId: 'book-103',
    bookTitle: 'Clean Architecture & Software Craftsmanship',
    borrowDate: new Date('2026-10-15T11:20:00Z'),
    returnDate: null,
    status: 'BORROWED',
  },
  {
    _id: 'borrow-203',
    studentName: 'Rohan Gupta',
    bookId: 'book-102',
    bookTitle: 'Operating System Concepts (Silberschatz)',
    borrowDate: new Date('2026-10-16T15:45:00Z'),
    returnDate: null,
    status: 'BORROWED',
  },
  {
    _id: 'borrow-204',
    studentName: 'Emily Watson',
    bookId: 'book-101',
    bookTitle: 'Distributed Systems: Concepts and Design',
    borrowDate: new Date('2026-10-17T10:10:00Z'),
    returnDate: null,
    status: 'BORROWED',
  },
];

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[Borrow Service] Connected to MongoDB at ${MONGODB_URI}`);

    const count = await BorrowingModel.countDocuments();
    if (count === 0) {
      const seedData = inMemoryBorrowings.map(({ _id, ...rest }) => rest);
      await BorrowingModel.insertMany(seedData);
      console.log(`[Borrow Service] Seeded MongoDB with ${seedData.length} borrowing records`);
    }
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Borrow Service] MongoDB not reachable (${err.message}). Using active in-memory store.`);
  }
}

connectDB();

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'borrow-service',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB (Connected)' : 'In-Memory Store (Active)',
    bookServiceUrl: BOOK_SERVICE_URL,
    notificationServiceUrl: NOTIFICATION_SERVICE_URL,
  });
});

// 2. Borrowing statistics
app.get('/borrow/stats', async (req, res) => {
  try {
    if (isMongoConnected) {
      const all = await BorrowingModel.find();
      const activeBorrowings = all.filter(b => b.status === 'BORROWED').length;
      const returnedCount = all.filter(b => b.status === 'RETURNED').length;
      const uniqueStudents = new Set(all.map(b => b.studentName.toLowerCase().trim())).size;
      return res.json({
        totalRecords: all.length,
        activeBorrowings,
        returnedCount,
        uniqueStudents,
      });
    }

    const activeBorrowings = inMemoryBorrowings.filter(b => b.status === 'BORROWED').length;
    const returnedCount = inMemoryBorrowings.filter(b => b.status === 'RETURNED').length;
    const uniqueStudents = new Set(inMemoryBorrowings.map(b => b.studentName.toLowerCase().trim())).size;
    res.json({
      totalRecords: inMemoryBorrowings.length,
      activeBorrowings,
      returnedCount,
      uniqueStudents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Borrowing history (sorted newest first)
app.get('/borrow/history', async (req, res) => {
  try {
    if (isMongoConnected) {
      const records = await BorrowingModel.find().sort({ borrowDate: -1 });
      return res.json(records);
    }
    const sorted = [...inMemoryBorrowings].sort(
      (a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)
    );
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Borrow a book (Inter-service REST call to Book Service & Notification Service)
app.post('/borrow', async (req, res) => {
  try {
    const { studentName, bookId } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: 'Student name is required' });
    }
    if (!bookId) {
      return res.status(400).json({ error: 'Book selection is required' });
    }

    // Step A: Communicate with Book Service to fetch book details
    let bookDetails;
    try {
      const bookRes = await axios.get(`${BOOK_SERVICE_URL}/books/${bookId}`, { timeout: 3000 });
      bookDetails = bookRes.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return res.status(400).json({ error: `Book Service query failed: ${msg}` });
    }

    if (!bookDetails) {
      return res.status(404).json({ error: 'Selected book could not be found' });
    }

    if (bookDetails.availableQuantity <= 0) {
      return res.status(400).json({ error: `Cannot borrow: "${bookDetails.title}" is out of stock` });
    }

    // Step B: Atomically decrement book quantity in Book Service via REST API
    try {
      await axios.patch(
        `${BOOK_SERVICE_URL}/books/${bookId}/inventory`,
        { delta: -1 },
        { timeout: 3000 }
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return res.status(400).json({ error: `Inventory update failed: ${msg}` });
    }

    // Step C: Save borrowing record in MongoDB or in-memory
    let savedRecord;
    const cleanStudentName = studentName.trim();
    const cleanBookTitle = bookDetails.title;

    if (isMongoConnected) {
      const newBorrowing = new BorrowingModel({
        studentName: cleanStudentName,
        bookId: String(bookId),
        bookTitle: cleanBookTitle,
        borrowDate: new Date(),
        returnDate: null,
        status: 'BORROWED',
      });
      savedRecord = await newBorrowing.save();
    } else {
      savedRecord = {
        _id: 'borrow-' + Date.now(),
        studentName: cleanStudentName,
        bookId: String(bookId),
        bookTitle: cleanBookTitle,
        borrowDate: new Date(),
        returnDate: null,
        status: 'BORROWED',
      };
      inMemoryBorrowings.unshift(savedRecord);
    }

    // Step D: Asynchronously trigger Notification Service
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/notifications`,
        {
          type: 'BORROW',
          message: `Book "${cleanBookTitle}" borrowed successfully by ${cleanStudentName}`,
          studentName: cleanStudentName,
          bookTitle: cleanBookTitle,
        },
        { timeout: 2000 }
      );
    } catch (notifErr) {
      console.warn(`[Borrow Service] Notification dispatch warning: ${notifErr.message}`);
    }

    res.status(201).json({
      message: 'Book borrowed successfully',
      borrowing: savedRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Return a book (Inter-service REST call to Book Service & Notification Service)
app.post('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let borrowingRecord;
    if (isMongoConnected) {
      borrowingRecord = await BorrowingModel.findById(id);
    } else {
      borrowingRecord = inMemoryBorrowings.find(b => String(b._id) === String(id));
    }

    if (!borrowingRecord) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }

    // Prevent duplicate returns
    if (borrowingRecord.status === 'RETURNED') {
      return res.status(400).json({ error: 'This book has already been returned' });
    }

    // Step A: Increment inventory in Book Service via REST API
    try {
      await axios.patch(
        `${BOOK_SERVICE_URL}/books/${borrowingRecord.bookId}/inventory`,
        { delta: 1 },
        { timeout: 3000 }
      );
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      return res.status(500).json({ error: `Failed to return inventory in Book Service: ${msg}` });
    }

    // Step B: Mark status as RETURNED with return timestamp
    const returnTimestamp = new Date();
    if (isMongoConnected) {
      borrowingRecord.status = 'RETURNED';
      borrowingRecord.returnDate = returnTimestamp;
      await borrowingRecord.save();
    } else {
      borrowingRecord.status = 'RETURNED';
      borrowingRecord.returnDate = returnTimestamp;
    }

    // Step C: Trigger Notification Service
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/notifications`,
        {
          type: 'RETURN',
          message: `Book "${borrowingRecord.bookTitle}" returned successfully by ${borrowingRecord.studentName}`,
          studentName: borrowingRecord.studentName,
          bookTitle: borrowingRecord.bookTitle,
        },
        { timeout: 2000 }
      );
    } catch (notifErr) {
      console.warn(`[Borrow Service] Notification dispatch warning: ${notifErr.message}`);
    }

    res.json({
      message: 'Book returned successfully',
      borrowing: borrowingRecord,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const isDirectRun = process.argv[1] && process.argv[1].includes('borrow-service');

if (isDirectRun || process.env.STANDALONE_BORROW === 'true') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Borrow Service] Running on port ${PORT}`);
  });
  server.on('error', err => {
    console.warn(`[Borrow Service] Notice on port ${PORT}: ${err.message}`);
  });
}

export default app;
