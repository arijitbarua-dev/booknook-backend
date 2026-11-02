import express from "express";
import { MongoClient } from 'mongodb';
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

app.post('/add-book', async (req, res) => {
  const data = req.body;
  const result = await bookCollection.insertOne(data);
  res.send(result);
})

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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server is running at port ${port}`)
})
