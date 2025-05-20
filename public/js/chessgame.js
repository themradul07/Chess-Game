const socket = io();
const chess = new Chess();
const statusBar = document.querySelector(".statusBar");
const wHistory = document.querySelector(".whitehistory");
const bHistory = document.querySelector(".blackhistory");
const boardElement = document.querySelector(".chessboard");
const roleElement = document.querySelector(".role");
let draggedPiece = null;
let squareSource = null;
let playerRole = null;


// Music items
const startMusic = new Audio("/music/startMusic.mp3");
const moveMusic = new Audio("/music/move.mp3");
const invalidMoveMusic = new Audio("/music/invalidmove.mp3");
// const gameOverMusic = new Audio("/audio/gameover.mp3");

function playMusic(e) {
    e.play();
}

function stopMusic(e) {
    e.pause();
    e.currentTime = 0;
}

function resetall() {
    statusBar.innerHTML = " ";
    wHistory.innerHTML = "";
    bHistory.innerHTML = "";
    roleElement = '';
}

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";




    board.forEach((row, rowIndex) => {
        const rowElement = document.createElement("div");
        rowElement.classList.add("row");

        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        squareSource = { row: rowIndex, col: squareIndex, type: pieceElement.innerHTML };

                        e.dataTransfer.setData("text/plain", "");
                    }

                })
                pieceElement.addEventListener("dragend", (e) => {
                    e.preventDefault();
                    draggedPiece = null;
                    squareSource = null;
                });
                squareElement.appendChild(pieceElement);
            }
            // squareElement.innerHTML= "."




            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();

            });
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    }

                    handleMove(squareSource, targetSource);
                }

            }
            );
            // squareElement.addEventListener("click", handleClick);
            // squareElement.appendChild(pieceElement)

            rowElement.appendChild(squareElement);
        });

        boardElement.appendChild(rowElement);
    });

    //flipping

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    }

}



const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
        color: playerRole,
        type: draggedPiece.innerHTML
    }

    socket.emit("move", move);



}
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        P: "♟",
        R: "♜",
        N: "♞",
        B: "♝",
        Q: "♛",
        K: "♚",
    }
    return unicodePieces[piece.type] || "";
}

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();

    if (role === "w") {
        roleElement.innerHTML = "You are playing as White";
    } else if (role === "b") {
        roleElement.innerHTML = "You are playing as Black";
    }
    else {
        roleElement.innerHTML = "You are a spectator ! You can only watch the game";
    }

});

socket.on("spectator", (params) => {
    playerRole = null;
    renderBoard();

});

// RELATED TO THE MOVES
socket.on("boardstate", function (fen) {
    chess.load(fen);
    renderBoard();
})

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();

});

socket.on("history", (move) => {

    playMusic(moveMusic);

    if (move.color === 'w') {
        const historyElement = document.createElement("div");
        historyElement.classList.add("history");
        historyElement.innerHTML = `${move.type} ${move.from} to ${move.to}`;
        wHistory.insertBefore(historyElement, wHistory.firstChild);
    }
    else {
        const historyElement = document.createElement("div");
        historyElement.classList.add("history");
        historyElement.innerHTML = `${move.type} ${move.from} to ${move.to}`;
        bHistory.insertBefore(historyElement, bHistory.firstChild);


    }
})

socket.on("turn", (turn) => {
    if (turn === 'w') {
        statusBar.innerHTML = "White's Turn";
    }
    else {
        statusBar.innerHTML = "Black's Turn";
    }
});

socket.on("checkmate", (winner) => {
    statusBar.innerText = `Checkmate! ${winner} wins.`;
});

socket.on("stalemate", (by) => {
    statusBar.innerText = `Stalemate! Game drawn.`;
});

socket.on("draw", (reason) => {
    statusBar.innerText = `Draw! Reason: ${reason}`;
});

// Ending of the moves

socket.on("gameongoing", function (fen) {
    chess.load(fen);
    if (playerRole == null) {
        statusBar.innerHTML = "You can only watch the game";
    }
    renderBoard();
})



socket.on("playerleft", (fen) => {
    chess.load(fen);
    alert("The player left the game");
    resetall();
    renderBoard();

}
)

socket.on("gameStarted", () => {
    // alert("Game Started");


    statusBar.innerHTML = "White's Turn";

    // playMusic(startMusic);

    renderBoard();

});


// invalidmove
socket.on("invalidMove", (move) => {
    playMusic(invalidMoveMusic);
    console.log("Invalid move", move);
    statusBar.innerHTML = "Invalid Move";
});





socket.on("gameOver", (winner) => {
    statusBar.innerText = `Game Over! ${winner} wins.`;
    // playMusic(gameOverMusic);

    renderBoard();  
});


renderBoard()