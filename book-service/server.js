import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import BookModel from './models/Book.js';

const app = express();
const PORT = process.env.BOOK_PORT || process.env.BOOK_SERVICE_PORT || 4001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/libraflow';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Initial sample books for immediate demonstration and testing
let inMemoryBooks = [
  {
    _id: 'book-101',
    title: 'Distributed Systems: Concepts and Design',
    author: 'George Coulouris',
    category: 'Computer Engineering',
    availableQuantity: 4,
    totalQuantity: 5,
    createdAt: new Date('2026-09-01T10:00:00Z'),
  },
  {
    _id: 'book-102',
    title: 'Operating System Concepts (Silberschatz)',
    author: 'Abraham Silberschatz',
    category: 'Computer Engineering',
    availableQuantity: 2,
    totalQuantity: 4,
    createdAt: new Date('2026-09-05T11:30:00Z'),
  },
  {
    _id: 'book-103',
    title: 'Clean Architecture & Software Craftsmanship',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    availableQuantity: 5,
    totalQuantity: 6,
    createdAt: new Date('2026-09-10T09:15:00Z'),
  },
  {
    _id: 'book-104',
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James Kurose & Keith Ross',
    category: 'Networking',
    availableQuantity: 1,
    totalQuantity: 3,
    createdAt: new Date('2026-09-15T14:20:00Z'),
  },
  {
    _id: 'book-105',
    title: 'Database System Concepts',
    author: 'Avi Silberschatz & Henry Korth',
    category: 'Databases',
    availableQuantity: 3,
    totalQuantity: 4,
    createdAt: new Date('2026-09-20T16:45:00Z'),
  },
  {
    _id: 'book-106',
    title: 'Kubernetes: Up and Running',
    author: 'Brendan Burns & Kelsey Hightower',
    category: 'Cloud & DevOps',
    availableQuantity: 3,
    totalQuantity: 3,
    createdAt: new Date('2026-10-01T08:00:00Z'),
  },
];

// Attempt MongoDB connection with 2-second timeout
async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[Book Service] Connected to MongoDB at ${MONGODB_URI}`);

    // Seed database if empty
    const count = await BookModel.countDocuments();
    if (count === 0) {
      const seedData = inMemoryBooks.map(({ _id, ...rest }) => rest);
      await BookModel.insertMany(seedData);
      console.log(`[Book Service] Seeded MongoDB with ${seedData.length} initial books`);
    }
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Book Service] MongoDB not reachable (${err.message}). Using active in-memory store.`);
  }
}

connectDB();

// 1. Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'book-service',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB (Connected)' : 'In-Memory Store (Active)',
  });
});

// 2. Statistics endpoint
app.get('/books/stats/summary', async (req, res) => {
  try {
    if (isMongoConnected) {
      const books = await BookModel.find();
      const totalBooks = books.length;
      const totalAvailableCopies = books.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
      return res.json({ totalBooks, totalAvailableCopies });
    }
    const totalBooks = inMemoryBooks.length;
    const totalAvailableCopies = inMemoryBooks.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
    res.json({ totalBooks, totalAvailableCopies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get all books with search filter
app.get('/books', async (req, res) => {
  try {
    const { search } = req.query;
    if (isMongoConnected) {
      let query = {};
      if (search && typeof search === 'string') {
        const regex = new RegExp(search.trim(), 'i');
        query = {
          $or: [{ title: regex }, { author: regex }, { category: regex }],
        };
      }
      const books = await BookModel.find(query).sort({ createdAt: -1 });
      return res.json(books);
    }

    let filtered = [...inMemoryBooks];
    if (search && typeof search === 'string') {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(
        b =>
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term)
      );
    }
    // Return newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const book = await BookModel.findById(id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      return res.json(book);
    }

    const book = inMemoryBooks.find(b => String(b._id) === String(id));
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Add new book
app.post('/books', async (req, res) => {
  try {
    const { title, author, category, availableQuantity } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    const qty = parseInt(availableQuantity, 10);
    const validQty = isNaN(qty) || qty < 0 ? 1 : qty;

    if (isMongoConnected) {
      const newBook = new BookModel({
        title: title.trim(),
        author: author.trim(),
        category: (category || 'General').trim(),
        availableQuantity: validQty,
        totalQuantity: validQty,
      });
      await newBook.save();
      return res.status(201).json(newBook);
    }

    const newBook = {
      _id: 'book-' + Date.now(),
      title: title.trim(),
      author: author.trim(),
      category: (category || 'General').trim(),
      availableQuantity: validQty,
      totalQuantity: validQty,
      createdAt: new Date(),
    };
    inMemoryBooks.unshift(newBook);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Edit book
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, availableQuantity } = req.body;

    const qty = parseInt(availableQuantity, 10);

    if (isMongoConnected) {
      const updateData = {};
      if (title) updateData.title = title.trim();
      if (author) updateData.author = author.trim();
      if (category) updateData.category = category.trim();
      if (!isNaN(qty) && qty >= 0) {
        updateData.availableQuantity = qty;
        updateData.totalQuantity = Math.max(qty, 1);
      }
      const updated = await BookModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Book not found' });
      return res.json(updated);
    }

    const bookIndex = inMemoryBooks.findIndex(b => String(b._id) === String(id));
    if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });

    if (title) inMemoryBooks[bookIndex].title = title.trim();
    if (author) inMemoryBooks[bookIndex].author = author.trim();
    if (category) inMemoryBooks[bookIndex].category = category.trim();
    if (!isNaN(qty) && qty >= 0) {
      inMemoryBooks[bookIndex].availableQuantity = qty;
      inMemoryBooks[bookIndex].totalQuantity = Math.max(qty, inMemoryBooks[bookIndex].totalQuantity || qty);
    }

    res.json(inMemoryBooks[bookIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Delete book
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      const deleted = await BookModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Book not found' });
      return res.json({ message: 'Book deleted successfully', id });
    }

    const initialLen = inMemoryBooks.length;
    inMemoryBooks = inMemoryBooks.filter(b => String(b._id) !== String(id));
    if (inMemoryBooks.length === initialLen) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Atomic Inventory Update (Used by Borrow Service)
app.patch('/books/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // -1 for borrow, +1 for return

    if (typeof delta !== 'number' || (delta !== 1 && delta !== -1)) {
      return res.status(400).json({ error: 'Invalid delta. Must be +1 or -1' });
    }

    if (isMongoConnected) {
      // If borrowing (delta = -1), ensure availableQuantity >= 1 atomically to prevent negative count
      const filter = { _id: id };
      if (delta === -1) {
        filter.availableQuantity = { $gte: 1 };
      }

      const updated = await BookModel.findOneAndUpdate(
        filter,
        { $inc: { availableQuantity: delta } },
        { new: true }
      );

      if (!updated) {
        return res.status(400).json({
          error: delta === -1 ? 'Book is currently out of stock' : 'Book not found',
        });
      }
      return res.json(updated);
    }

    // In-memory atomic update
    const book = inMemoryBooks.find(b => String(b._id) === String(id));
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (delta === -1 && book.availableQuantity <= 0) {
      return res.status(400).json({ error: 'Book is currently out of stock' });
    }

    book.availableQuantity += delta;
    if (book.availableQuantity < 0) book.availableQuantity = 0;
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const isDirectRun = process.argv[1] && process.argv[1].includes('book-service');

if (isDirectRun || process.env.STANDALONE_BOOK === 'true') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Book Service] Running on port ${PORT}`);
  });
  server.on('error', err => {
    console.warn(`[Book Service] Notice on port ${PORT}: ${err.message}`);
  });
}

export default app;
