require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const cors = require('cors');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.preca8g.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db('Novel_Nest');
    const booksCollection = db.collection('Books');
    const userCollection = db.collection('users');

    app.get('/books', async (req, res) => {

      const searchTerm = req.query.searchTerm;

      if (searchTerm) {
        const books = await booksCollection.find({
          $or: [
            { Genre: { $regex: searchTerm, $options: 'i' } },
            { Title: { $regex: searchTerm, $options: 'i' } },
            { Author: { $regex: searchTerm, $options: 'i' } },
          ],
        }).toArray();
        res.send({ status: true, count: books.length, data: books });
      }
      else {
        const cursor = booksCollection.find({});
        const books = await cursor.toArray();
        res.send({ status: true, count: books.length, data: books });
      }
    });

    app.post('/book', async (req, res) => {
      const book = req.body;
      console.log(req.body);

      const result = await booksCollection.insertOne(book);
      console.log(result);

      res.send(result);
    });

    app.get('/book/:id', async (req, res) => {
      const id = req.params.id;

      const result = await booksCollection.findOne({ _id: ObjectId(id) });
      console.log(result);
      res.send(result);
    });

    app.patch('/book/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await booksCollection.findOneAndUpdate(
        { _id: ObjectId(id) },
        { $set: updatedData },
      );

      if (result.value) {
        res.status(200).json(result);
      } else {
        res.status(404).json({ error: 'Book not found' });
      }
    });

    app.delete('/book/:id', async (req, res) => {
      const id = req.params.id;

      const result = await booksCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });

    app.post('/Reviews/:id', async (req, res) => {
      const bookId = req.params.id;
      const Review = req.body;

      console.log(bookId);
      console.log(Review);

      const result = await booksCollection.updateOne(
        { _id: ObjectId(bookId) },
        { $push: { Reviews: Review } }
      );

      console.log(result);

      if (result.modifiedCount !== 1) {
        console.error('Book not found or comment not added');
        res.json({ error: 'Book not found or comment not added' });
        return;
      }

      console.log('Reviews added successfully');
      res.json({ message: 'Reviews added successfully' });
    });

    app.get('/Reviews/:id', async (req, res) => {
      const productId = req.params.id;

      const result = await booksCollection.findOne(
        { _id: ObjectId(productId) },
        { projection: { _id: 0, Reviews: 1 } }
      );

      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'book not found' });
      }
    });

    app.post('/user', async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;

      const result = await userCollection.findOne({ email });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('Novel_Nest server is Activated!');
});

app.listen(port, () => {
  console.log(`Novel_Nest server listening on port ${port}`);
});   
