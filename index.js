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
        console.log("Deu certo o login")
        return res.sendStatus(httpStatus.CREATED);

    } catch (error) {
        return res.send(error.message);
    }
})

app.post("/tweets", async(req,res)=>{
    const msg = req.body;
    try {

        const user = await db.collection("users").findOne({username: msg.username});
        console.log(user);
        const avatar = user.avatar;


        await db.collection("tweets").insertOne({
            username: msg.username,
            avatar,
            tweet: msg.tweet
        })
        console.log("Deu certo eu acho")
        return res.sendStatus(httpStatus.CREATED)
    } catch (error) {
        return res.send(error.message);
    }
})

app.get("/tweets", async(req,res) => {
    const tweets = await db.collection("tweets").find().toArray()
        .then(tweets => {
            return res.send(tweets.reverse())
        })
        .catch(err => res.send(err))
})

app.get("/users", (req,res) => {
    const tweets = req.body;
    db.collection("users").find().toArray()
        .then(users => {
            console.log(users)
            return res.send(users)
        })
        .catch(err => res.send(err))
})

app.listen(porta);