import express from "express";
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';

const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

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

// GET /books (Supports search, category filter, and sorting)
app.get('/books', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const query = {};

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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running at port ${port}`)
})
