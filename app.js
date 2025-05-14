const express = require('express');
const { Chess } = require('chess.js');
const http = require('http');
const socket = require('socket.io');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let noofplayers = 0;
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on("connection", (uniquesocket) => {
    console.log("connected");
    noofplayers++;
    console.log("Number of players: " + noofplayers);
    if (noofplayers >= 2) {
       console.log("Game started");
        io.emit("gameStarted", chess.fen());
        chess.reset();
       
    }

   
    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id === players.white) {
            delete players.white;
        }
        if (uniquesocket.id === players.black) {
            delete players.black;
        }
        noofplayers--;
        console.log("disconnected");
    });

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("playerRole", "spectator");
    }

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;
           
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else {
                console.log("Invalid move");
                uniquesocket.emit("invalidMove", move);
            }
            io.emit("history", move)
            io.emit("turn", chess.turn());  
           
        }
        catch (err) {
            

            uniquesocket.emit("invalidMove", move);
        }

    });



});
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});