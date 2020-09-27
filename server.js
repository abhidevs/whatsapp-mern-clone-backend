// imports
const express = require("express");
const mongoose = require("mongoose");
const Messages = require("./dbMessages");
const Pusher = require('pusher');
const cors = require('cors');


// app config
const app = express();
const port = process.env.PORT || 3535;

var pusher = new Pusher({
  appId: "1080606",
  key: "85ec96e085234d39ff47",
  secret: "7827bdb8409242fc92c0",
  cluster: "ap1",
  encrypted: true,
});


// middleware
app.use(express.json());

app.use(cors());


// DB config
const conn_url =
  "mongodb+srv://admin:Czk0NJmnjwgkcKnU@cluster0.wzzkh.mongodb.net/whatsapp-mern-clone-db?retryWrites=true&w=majority";
mongoose.connect(conn_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                sent: messageDetails.sent,
            })
        } else {
            console.log('Error while triggering Pusher');
        }
    })
})


// ????


// api routes
app.get("/", (req, res) => res.status(200).send("Whatsapp-mern-clone-backend"));

app.get("/api/v1/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/api/v1/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(`new message created: \n ${data}`);
    }
  });
});


// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
