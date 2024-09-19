import express from "express"
import cors from "cors"
import httpStatus from "http-status"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"

dotenv.config();
const databaseURL = process.env.DATABASE_URL;
const porta = process.env.PORTA

const app = express();
app.use(express.json())
app.use(cors());

const mongoClient = new MongoClient(databaseURL);
let db;

mongoClient.connect()
    .then(() => db = mongoClient.db()) // se a conexão funcionar
    .catch((err) => console.log(err.message)); // se a conexão der erro

app.post("/sign-up", async (req, res) => {
    const user = req.body;
    try {
        await db.collection("users").insertOne({
            username: user.username,
            avatar: user.avatar
        });
        return res.sendStatus(httpStatus.CREATED);

    } catch (error) {
        return res.send(error.message);
    }
})

app.get("/tweets", (req,res) => {
    const tweets = req.body;
    db.collection("tweets").find().toArray()
        .then(tweets => {
            return res.send(tweets)
        })
        .catch(err => res.send(err))
})

app.get("/users", (req,res) => {
    const tweets = req.body;
    db.collection("users").find().toArray()
        .then(users => {
            return res.send(users)
        })
        .catch(err => res.send(err))
})

app.listen(porta);