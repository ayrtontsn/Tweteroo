import express from "express"
import cors from "cors"
import httpStatus from "http-status"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

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

    const signUpSchema = joi.object({
        username: joi.string().min(1).max(16).required(),
        avatar: joi.string().required()
    })

    try {
        const validation = signUpSchema.validate(user, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);

            console.log(errors)
            return res.sendStatus(httpStatus.UNPROCESSABLE_ENTITY);
        }

        const newuser = await db.collection("users").findOne({ username: user.username });
        if (newuser) {
            return res.sendStatus(httpStatus.NO_CONTENT);
        };

        await db.collection("users").insertOne({
            username: user.username,
            avatar: user.avatar
        });
        return res.sendStatus(httpStatus.CREATED);

    } catch (error) {
        return res.send(error.message);
    }
})

app.post("/tweets", async (req, res) => {
    const msg = req.body;
    try {
        const usertweet = await db.collection("users").findOne({ username: msg.username });
        if (!usertweet) {
            return res.sendStatus(httpStatus.UNAUTHORIZED);
        };
        const avatar = usertweet.avatar;

        const userSchema = joi.object({
            username: joi.string().required(),
            avatar: joi.string().required(),
            tweet: joi.string().min(1).required()
        })

        const tweet = {
            username: msg.username,
            avatar,
            tweet: msg.tweet
        }
        const validation = userSchema.validate(tweet, { abortEarly: false })

        if (validation.error) {
            const errors = validation.error.details.map((detail) => detail.message);
            return res.status(422).send(errors);
        }
        await db.collection("tweets").insertOne(tweet)

        return res.sendStatus(httpStatus.CREATED)
    } catch (error) {
        return res.send(error.message);
    }
})

app.get("/tweets", async (req, res) => {
    await db.collection("tweets").find().toArray()
        .then(tweets => {
            return res.send(tweets.reverse())
        })
        .catch(err => res.send(err))
})

app.delete("/tweets/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const tweet = await db.collection("tweets").deleteOne({ _id: new ObjectId(id) })
        if(!tweet){
            return res.sendStatus(httpStatus.NOT_FOUND);
        }

        return res.sendStatus(httpStatus.NO_CONTENT)
    } catch (error) {
        res.sendStatus(httpStatus.BAD_REQUEST)
    }
})

app.put("/tweets/:id", async (req, res) => {
    const msg = req.body;
    const { id } = req.params;
    let newmsg = msg.tweet

    try {
        const tweet = await db.collection("tweets").findOne({ _id: new ObjectId(id) })
        if(!tweet){
            return res.sendStatus(httpStatus.NOT_FOUND);
        }

        const newtweet = {
            username: tweet.username,
            avatar: tweet.avatar,
            tweet: newmsg
        }

        if (!newmsg) newtweet.tweet = tweet.tweet

        await db.collection("tweets").updateOne(
            { _id: new ObjectId(id) }, {
            $set: newtweet
        })

        return res.sendStatus(httpStatus.NO_CONTENT)

    } catch (error) {
        res.sendStatus(httpStatus.NOT_FOUND)
    }
})

app.listen(porta);