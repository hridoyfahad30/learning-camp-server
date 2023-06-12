const express= require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
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

// Verify JWT 
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error){
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allClassesCollection = client.db("learningCamp").collection("allClasses");
    const usersCollection = client.db("learningCamp").collection("allUsers");
    const selectClassCollection = client.db("learningCamp").collection("selectClasses");

    // JWT 
    app.post('/jwt', async (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token});
    });

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

    // Update Instructor Profile
    app.put('/profile', async (req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const options = {upsert: true};
      const updateApproveCount = {$inc:{ approved: 1}}
      const result = await usersCollection.updateOne(query, updateApproveCount, options);
      res.send(result)
    });
    
    // Get User Profile Information
    app.get('/profile', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // Class Related API
    app.post('/add-select-class', verifyJWT, async (req, res) => {
      const addSelectClass = req.body;
      const result = await selectClassCollection.insertOne(addSelectClass);
      res.send(result);
    });

    // Class Related API
    app.post('/add-a-class', verifyJWT, async (req, res) => {
      const addClass = req.body;
      const result = await allClassesCollection.insertOne(addClass);
      res.send(result);
    });

    // Get All User
    app.get('/all-classes', async (req, res) => {
      const result = await allClassesCollection.find().toArray();
      res.send(result);
    });

    // Get Instructor Classes by Email
    app.get('/my-selected-classes', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await selectClassCollection.find(query).toArray();
      res.send(result);
    });
    

    // Get Instructor Classes by Email
    app.get('/instructor-classes', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, message: 'forbidden access'})
      }
      let query = {};
      if(req.query?.email){
        query = {instructorEmail: req.query.email}
      }
      const result = await allClassesCollection.find(query).toArray();
      res.send(result);
    });

    // Update Class Status ny Admin
    app.put('/update-class-status/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updateClassStatus = {$set: status}
      const result = await allClassesCollection.updateOne(query, updateClassStatus, options);
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