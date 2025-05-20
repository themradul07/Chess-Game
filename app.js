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


    if (noofplayers == 2) {
        console.log("Game started");
        io.emit("gameStarted", chess.fen());
        chess.reset();

    }
    if (noofplayers > 2) {
        console.log("Game started");
        io.emit("gameongoing", chess.fen());


    }
    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id === players.white) {
            delete players.white;
            chess.reset();
            io.emit("playerleft", chess.fen());
        }
        if (uniquesocket.id === players.black) {
            delete players.black;
            chess.reset();
            io.emit("playerleft", chess.fen());
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

    // uniquesocket.on("move", (move) => {
    //     try {
    //         if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
    //         if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

    //         const result = chess.move(move);
    //         if (result) {
    //             currentPlayer = chess.turn();
    //             io.emit("move", move);
    //             io.emit("boardState", chess.fen());
    //         }
    //         else {
    //             console.log("Invalid move");
    //             uniquesocket.emit("invalidMove", move);
    //         }


    //         if (chess.in_checkmate()) {
    //             console.log("Checkmate!");
    //             io.emit("checkmate", chess.turn());
    //         } else if (chess.in_stalemate()) {
    //             console.log("Stalemate!");
    //             io.emit("stalemate", chess.turn());
    //         } else if (chess.in_draw()) {
    //             console.log("Draw!");
    //             io.emit("draw", chess.turn());
    //         } else if (chess.insufficient_material()) {
    //             console.log("Draw due to insufficient material!");
    //             io.emit("draw", chess.turn());
    //         } else if (chess.in_threefold_repetition()) {
    //             console.log("Draw by threefold repetition!");
    //             io.emit("draw", chess.turn());
    //         }




    //         io.emit("history", move)
    //         io.emit("turn", chess.turn());




    //     }
    //     catch (err) {


    //         uniquesocket.emit("invalidMove", move);
    //     }

    // });

    uniquesocket.on("move", (move) => {
        try {
            // Ensure correct player is making the move
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (!result) {
                console.log("Invalid move");
                return uniquesocket.emit("invalidMove", move);
            }

            const currentTurn = chess.turn(); // after the move
            const winner = currentTurn === 'w' ? 'black' : 'white'; // last player

            io.emit("move", move);
            io.emit("boardState", chess.fen());
            io.emit("history", move);
            io.emit("turn", currentTurn);

            console.log(chess.isCheckmate());
            

            // Game over conditions
            

            if (chess.isCheckmate()) {
                console.log("Checkmate!");
                io.emit("checkmate", winner);
            } else if (chess.in_stalemate()) {
                console.log("Stalemate!");
                io.emit("stalemate", winner);
            } else if (chess.in_draw()) {
                console.log("Draw!");
                io.emit("draw", "draw");
            } else if (chess.insufficient_material()) {
                console.log("Draw due to insufficient material!");
                io.emit("draw", "insufficient_material");
            } else if (chess.in_threefold_repetition()) {
                console.log("Draw by threefold repetition!");
                io.emit("draw", "threefold_repetition");
            }

            if(chess.isGameOver()){
                console.log("Game Over");
                io.emit("gameOver", winner);
                
            }

        } catch (err) {
            console.error("Move error:", err);
            uniquesocket.emit("invalidMove", move);
        }
    });



});
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});