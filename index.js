import express from "express"
import cors from "cors"
import httpStatus from "http-status"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import Joi from "joi"

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

    const usertweet = await db.collection("users").findOne({username: msg.username});
    if (!usertweet){
        return res.status(httpStatus.UNAUTHORIZED);
    }
    const avatar = usertweet.avatar;

    const schema =Joi.object({
        username: Joi.string().required(),
        avatar: Joi.string().required(),
        tweet: Joi.string().required()
    })

    try {       
        const tweet = await db.collection("tweets").insertOne({
            username: msg.username,
            avatar,
            tweet: msg.tweet
        })

        schema.validate(tweet, {abortEarly: false})

        return res.sendStatus(httpStatus.CREATED)
    } catch (error) {
        return res.status(httpStatus.UNPROCESSABLE_ENTITY);
    }
})

app.get("/tweets", async(req,res) => {
    await db.collection("tweets").find().toArray()
        .then(tweets => {
            return res.send(tweets.reverse())
        })
        .catch(err => res.send(err))
})

app.delete("/tweets/:id", async(req,res) =>{
    const { id } = req.params;

    try {
        const tweetdel = await db.collection("tweets").deleteOne({ _id: new ObjectId(id)})

        if (tweetdel.deletedCount === 0) {
            console.log("não deletou")}

        return res.sendStatus(httpStatus.NO_CONTENT)
    } catch (error) {
        res.sendStatus(httpStatus.BAD_REQUEST)
    }
})

app.listen(porta);