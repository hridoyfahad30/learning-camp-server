const express= require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken')

const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200
}


// middleWare

app.use(cors(corsOptions));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.duvqeeu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allClassesCollection = client.db("learningCamp").collection("allClasses");
    const usersCollection = client.db("learningCamp").collection("allUsers");

    // Users Related API

    app.put('/all-users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = {email: email};
      const options = {upsert: true};
      const updateUser = {$set: user}
      const result = await usersCollection.updateOne(query, updateUser, options);
      res.send(result);
    });

    app.get('/all-users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    });
    

    // Class Related API

    app.post('/add-a-class', async (req, res) => {
      const addClass = req.body;
      const result = await allClassesCollection.insertOne(addClass);
      res.send(result);
    });

    app.get('/all-classes', async (req, res) => {
      const result = await allClassesCollection.find().toArray();
      res.send(result);
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Learning Camp is running')
});

app.listen(port, () => {
    console.log('Learning Camp is running on', port);
})