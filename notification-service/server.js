import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import NotificationModel from './models/Notification.js';

const app = express();
const PORT = process.env.NOTIFICATION_PORT || process.env.NOTIFICATION_SERVICE_PORT || 4003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/libraflow';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Sample initial notifications
let inMemoryNotifications = [
  {
    _id: 'notif-1',
    type: 'RETURN',
    message: 'Book "Computer Networking: A Top-Down Approach" returned by Alex Johnson',
    studentName: 'Alex Johnson',
    bookTitle: 'Computer Networking: A Top-Down Approach',
    timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
  },
  {
    _id: 'notif-2',
    type: 'BORROW',
    message: 'Book "Clean Architecture & Software Craftsmanship" borrowed by Priya Sharma',
    studentName: 'Priya Sharma',
    bookTitle: 'Clean Architecture & Software Craftsmanship',
    timestamp: new Date(Date.now() - 1000 * 60 * 95), // 95 mins ago
  },
  {
    _id: 'notif-3',
    type: 'BORROW',
    message: 'Book "Operating System Concepts (Silberschatz)" borrowed by Rohan Gupta',
    studentName: 'Rohan Gupta',
    bookTitle: 'Operating System Concepts (Silberschatz)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
  {
    _id: 'notif-4',
    type: 'INFO',
    message: 'Distributed Library System initialized with automated event logging',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
  },
];

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[Notification Service] Connected to MongoDB at ${MONGODB_URI}`);

    const count = await NotificationModel.countDocuments();
    if (count === 0) {
      const seedData = inMemoryNotifications.map(({ _id, ...rest }) => rest);
      await NotificationModel.insertMany(seedData);
      console.log(`[Notification Service] Seeded MongoDB with ${seedData.length} notifications`);
    }
  } catch (err) {
    isMongoConnected = false;
    console.log(`[Notification Service] MongoDB not reachable (${err.message}). Using active in-memory store.`);
  }
}

connectDB();

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB (Connected)' : 'In-Memory Store (Active)',
  });
});

// 2. Get all notifications (newest first)
app.get('/notifications', async (req, res) => {
  try {
    if (isMongoConnected) {
      const notifs = await NotificationModel.find().sort({ createdAt: -1 });
      return res.json(notifs);
    }
    const sorted = [...inMemoryNotifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create notification
app.post('/notifications', async (req, res) => {
  try {
    const { type, message, studentName, bookTitle } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Notification message is required' });
    }

    if (isMongoConnected) {
      const newNotif = new NotificationModel({
        type: type || 'INFO',
        message: message.trim(),
        studentName: studentName ? studentName.trim() : '',
        bookTitle: bookTitle ? bookTitle.trim() : '',
        timestamp: new Date(),
      });
      await newNotif.save();
      return res.status(201).json(newNotif);
    }

    const newNotif = {
      _id: 'notif-' + Date.now(),
      type: type || 'INFO',
      message: message.trim(),
      studentName: studentName ? studentName.trim() : '',
      bookTitle: bookTitle ? bookTitle.trim() : '',
      timestamp: new Date(),
    };
    inMemoryNotifications.unshift(newNotif);
    res.status(201).json(newNotif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Clear/Delete all notifications
app.delete('/notifications', async (req, res) => {
  try {
    if (isMongoConnected) {
      await NotificationModel.deleteMany({});
      return res.json({ message: 'All notifications cleared' });
    }
    inMemoryNotifications = [];
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const isDirectRun = process.argv[1] && process.argv[1].includes('notification-service');

if (isDirectRun || process.env.STANDALONE_NOTIF === 'true') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Notification Service] Running on port ${PORT}`);
  });
  server.on('error', err => {
    console.warn(`[Notification Service] Notice on port ${PORT}: ${err.message}`);
  });
}

export default app;
