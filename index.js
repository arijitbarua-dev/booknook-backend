import express from "express";
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

// JWKS endpoint configuration to verify JWT tokens issued by Better Auth
const JWKS_URL = process.env.JWKS_URL || 'http://localhost:3000/api/auth/jwks';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

// Middleware to verify JWT token using JWKS endpoint
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ error: "Unauthorized: No token provided or malformed authorization header." });
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("JWKS Token verification failed:", error.message);
    return res.status(403).send({ error: "Forbidden: Invalid or expired token." });
  }
};

// MongoDB
const client = new MongoClient(process.env.MONGODB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("BookNook");
const bookCollection = db.collection("books");
const borrowCollection = db.collection("borrows");

// POST /books and /add-book
app.post(['/books', '/add-book'], async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    const result = await bookCollection.insertOne(data);
    res.status(201).send({ ...result, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ error: "Failed to add book" });
  }
})

// GET /new-arrivals (Sorted by newest first, limit 6)
app.get('/new-arrivals', async (req, res) => {
  try {
    const result = await bookCollection
      .find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch new arrivals" });
  }
})

// GET /books (Supports search, category filter, user filter, and sorting)
app.get('/books', async (req, res) => {
  try {
    const { category, search, sort, addedByEmail } = req.query;
    const query = {};

    if (addedByEmail) {
      query.addedByEmail = String(addedByEmail);
    }

    if (category && category !== "All") {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOptions = { createdAt: -1, _id: -1 };
    if (sort === "oldest") {
      sortOptions = { createdAt: 1, _id: 1 };
    } else if (sort === "title_asc") {
      sortOptions = { title: 1 };
    } else if (sort === "title_desc") {
      sortOptions = { title: -1 };
    }

    const result = await bookCollection
      .find(query)
      .sort(sortOptions)
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch books" });
  }
})

// PUT & PATCH /books/:id (Update a book)
const updateBookHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const { title, author, category, image, description, totalCopies, availableCopies } = req.body;
    const updateDoc = {
      $set: {
        ...(title && { title }),
        ...(author && { author }),
        ...(category && { category }),
        ...(image && { image }),
        ...(description && { description }),
        ...(totalCopies !== undefined && { totalCopies: Number(totalCopies) }),
        ...(availableCopies !== undefined && { availableCopies: Number(availableCopies) }),
        updatedAt: new Date().toISOString(),
      },
    };

    const result = await bookCollection.updateOne(query, updateDoc);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Book not found." });
    }

    res.send({ success: true, message: "Book updated successfully." });
  } catch (error) {
    res.status(500).send({ error: "Failed to update book." });
  }
};

app.put('/books/:id', updateBookHandler);
app.patch('/books/:id', updateBookHandler);

// DELETE /books/:id (Delete a book)
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const result = await bookCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Book not found." });
    }

    res.send({ success: true, message: "Book deleted successfully." });
  } catch (error) {
    res.status(500).send({ error: "Failed to delete book." });
  }
});

// GET /books/:id (Get single book)
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const book = await bookCollection.findOne(query);
    if (!book) {
      return res.status(404).send({ error: "Book not found" });
    }
    res.send(book);
  } catch (error) {
    res.status(500).send({ error: "Failed to retrieve book" });
  }
})

// POST /borrows (Borrow a book)
app.post('/borrows', async (req, res) => {
  try {
    const { bookId, bookTitle, bookImage, userName, userEmail, borrowDate, returnDate, bookAuthor, bookCategory } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).send({ error: "bookId and userEmail are required." });
    }

    let bookQuery = {};
    if (ObjectId.isValid(bookId)) {
      bookQuery = { _id: new ObjectId(bookId) };
    } else {
      bookQuery = { _id: bookId };
    }

    // Check book availability
    const book = await bookCollection.findOne(bookQuery);
    if (!book) {
      return res.status(404).send({ error: "Book not found." });
    }

    if ((book.availableCopies ?? 0) <= 0) {
      return res.status(400).send({ error: "No available copies left for borrowing." });
    }

    const cleanEmail = String(userEmail).trim().toLowerCase();

    // Prevent duplicate active borrowing by the same user
    const existingBorrow = await borrowCollection.findOne({
      bookId: String(bookId),
      userEmail: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
    });

    if (existingBorrow) {
      return res.status(400).send({ error: "You have already borrowed this book." });
    }

    // Atomic decrement of available copies
    await bookCollection.updateOne(bookQuery, {
      $inc: { availableCopies: -1 },
    });

    // Create borrowing record
    const borrowRecord = {
      bookId: String(bookId),
      bookTitle: bookTitle || book.title || "Untitled Book",
      bookImage: bookImage || book.image || "",
      bookAuthor: bookAuthor || book.author || "",
      bookCategory: bookCategory || book.category || "Fiction",
      userName: userName || "Library Reader",
      userEmail: cleanEmail,
      borrowDate: borrowDate || new Date().toISOString(),
      returnDate: returnDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    const result = await borrowCollection.insertOne(borrowRecord);

    res.status(201).send({
      success: true,
      insertedId: result.insertedId,
      availableCopies: Math.max(0, (book.availableCopies ?? 1) - 1),
    });
  } catch (error) {
    console.error("Borrow error:", error);
    res.status(500).send({ error: "Failed to process book borrowing." });
  }
});

// GET /borrows (Get borrowed books for current user)
app.get('/borrows', async (req, res) => {
  try {
    const targetEmail = req.query.userEmail || req.query.email;
    const query = targetEmail
      ? { userEmail: { $regex: new RegExp(`^${String(targetEmail).trim()}$`, 'i') } }
      : {};

    const result = await borrowCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to retrieve borrowed books." });
  }
});

// DELETE /borrows/:id (Return a book)
app.delete('/borrows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let borrowQuery = {};
    if (ObjectId.isValid(id)) {
      borrowQuery = { _id: new ObjectId(id) };
    } else {
      borrowQuery = { _id: id };
    }

    let borrowRecord = await borrowCollection.findOne(borrowQuery);

    // If not found by borrow id, attempt finding by bookId
    if (!borrowRecord) {
      borrowRecord = await borrowCollection.findOne({ bookId: String(id) });
    }

    if (!borrowRecord) {
      return res.status(404).send({ error: "Borrowing record not found." });
    }

    // Remove the borrowing record
    await borrowCollection.deleteOne({ _id: borrowRecord._id });

    // Increase available copies in bookCollection
    let bookQuery = {};
    if (ObjectId.isValid(borrowRecord.bookId)) {
      bookQuery = { _id: new ObjectId(borrowRecord.bookId) };
    } else {
      bookQuery = { _id: borrowRecord.bookId };
    }

    await bookCollection.updateOne(bookQuery, {
      $inc: { availableCopies: 1 },
    });

    res.send({ success: true, message: "Book returned successfully." });
  } catch (error) {
    res.status(500).send({ error: "Failed to return book." });
  }
});

// PUT & PATCH /borrows/:id (Update a booking / borrow record)
const updateBorrowHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { _id: id };
    }

    const { returnDate, borrowDate, notes, userEmail, userName } = req.body;
    const updateDoc = {
      $set: {
        ...(returnDate && { returnDate }),
        ...(borrowDate && { borrowDate }),
        ...(notes && { notes }),
        ...(userEmail && { userEmail: String(userEmail).trim().toLowerCase() }),
        ...(userName && { userName }),
        updatedAt: new Date().toISOString(),
      },
    };

    const result = await borrowCollection.updateOne(query, updateDoc);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Borrowing record not found." });
    }

    res.send({ success: true, message: "Borrowing record updated successfully." });
  } catch (error) {
    res.status(500).send({ error: "Failed to update borrowing record." });
  }
};

app.put(['/borrows/:id', '/borrow/:id'], updateBorrowHandler);
app.patch(['/borrows/:id', '/borrow/:id'], updateBorrowHandler);

// GET /verify-token (Verify JWT token via JWKS endpoint and return decoded user info)
app.get('/verify-token', verifyToken, (req, res) => {
  res.send({
    valid: true,
    message: "Token verified successfully via JWKS endpoint.",
    user: req.user,
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running at port ${port}`)
})
