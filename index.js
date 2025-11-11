// dependance 
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
var admin = require("firebase-admin");
var serviceAccount = require("./finease-admin-sdk.json");

const app = express()
const port = process.env.PORT || 3000


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors())
app.use(express.json())

// custom middleware 
const verifyFirebaseToken = async(req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized access" })
    }
    const token = req.headers.authorization.split(" ")[1]
    if(!token){
       return res.status(401).send({ message: "Unauthorized access" }) 
    }

    // verifying token 
    try {
    const decode= await admin.auth().verifyIdToken(token)  
    req.token_email=decode.email
    next()
    } catch {
       return res.status(401).send({ message: "Unauthorized access" })  
    }
}

app.get('/', (req, res) => {
    res.status
    res.send("server is running")
})

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wfr9cox.mongodb.net/?appName=Cluster0`;
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
        const db = client.db("FinEase")
        const transactionsCollection = db.collection("transactions")

        // handle apis here 
        app.get("/my-transactions", verifyFirebaseToken, async (req, res) => {
            const email = req.query.email
            if(req.token_email!==email){
                return res.status(403).send({message:"Forbidden access"})
            }
            let query = {}
            if (email) {
                query.email = email
                const result = await transactionsCollection.find(query).toArray()
                return res.send(result)
            }
            res.send({ message: "Expect an Email", data: {} })
        })
        app.post('/add-transaction',verifyFirebaseToken ,async (req, res) => {
            const newTransaction = req.body
            const result = await transactionsCollection.insertOne(newTransaction)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
