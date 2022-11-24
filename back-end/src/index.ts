const mqtt = require('mqtt');
const express = require('express');
const app = express();
const PORT = 4000;
const http = require('http').Server(app);
const cors = require('cors');

const { initializeApp } = require('firebase-admin/app');
const admin = require('firebase-admin');
var serviceAccount = require("../santurbandb-firebase-adminsdk-tqx10-a8ddd84c08.json");

initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://santurbandb-default-rtdb.firebaseio.com'
});
const db = admin.database();

//MQTT
const host = 'nam1.cloud.thethings.network';
const port = 1883;
const connectUrl = `mqtt://${host}:${port}`
const clientId = `no-tocar@ttn`
const topic = '#';
const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'no-tocar@ttn',
    password: 'NNSXS.7T5MRUZ75AOAAS3DK5GIQYDIQIYTCMMXTEZMLLI.YY3HHUREMSJJUZ4YDTTO3NJELW2WN4STXRCTEWTZUVXLPIHG5SUA',
    reconnectPeriod: 1000,
});


client.on('connect', () => {
    client.subscribe(topic, () => {
        console.log(`listen events mqtt on topic '${topic}'`)
    });
});

client.setMaxListeners(0);

client.on('close', function () {
    console.log("connection closed")
});

client.on("error", function (error) {
    console.log("Can't connect" + error);
});

app.use(cors());
app.use(express.static("public"));

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000" //PROD https://santurban.herokuapp.com
    }
});

socketIO.on('connection', (socket) => {
    client.on('message', (topic, payload) => {
        console.log(payload.toString());
        socket.emit('message', payload.toString());
        //save to firebase
        db.ref('data').push(payload);
    });
});

app.get('/', (req, res) => {
    res.sendFile('public.html', { root: "public" });
});

http.listen(process.env.PORT || PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

app.get('/estadisticas', async(req, res) => {
    const ref = db.ref('data');
    const snapshot = await ref.once('value');
    const value = snapshot.val();
    res.send(value);
});


