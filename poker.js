var turn = 0;
var socket = io();

var playerHand = [];
var cpuHand = [];
var board = [];
var pMoney = 100;
var pBet = 0;
var pFlush = {};
var cFlush = {};
var currentBet = 0;

socket.on('updateBet', function(bet){
	document.getElementById("currentBetText").innerText = bet;
	currentBet = bet;
});

socket.on('roomUpdate', function(room) {
    var newButton = document.createElement('button');
    newButton.innerText = room;
    newButton.id = room;
    newButton.value = room;
    newButton.style.margin = "5px";
    document.getElementById("roomList").append(newButton);
    newButton.addEventListener("click", function() {
        socket.emit("join_room", newButton.value)
    });
});
	
socket.on('claimPrize', function(prize){
	pMoney = pMoney + prize;
	document.getElementById("currentFundsText").innerText = pMoney;
		document.getElementById("potTxt").innerText = 0;
});

socket.on('splitPrize', function(prize){
	pMoney = pMoney + prize;
	document.getElementById("currentFundsText").innerText = pMoney;
	document.getElementById("potTxt").innerText = 0;
});

document.getElementById("joinRoomButton").addEventListener("click", roomJoin);

function roomJoin() {
    socket.emit("create_room", document.getElementById("roomInput").value);
}

document.getElementById("placeBetBtn").addEventListener("click", placeBet);
document.getElementById("foldBtn").addEventListener("click", foldTurn);
document.getElementById("checkBtn").addEventListener("click", checkTurn);
document.getElementById("callBtn").addEventListener("click", callTurn);

function callTurn(){
	socket.emit('userBet', activeRoom, currentBet);
}

socket.on('startNewHand', function(){
	console.log("startNewHand was called");
var playerHand = [];
var player2Hand = [];
var board = [];
var pBet = 0;
var pFlush = {};
var cFlush = {};
});
	
function foldTurn() {
    socket.emit('userTurn', activeRoom, 'fold');
}

socket.on('updatePot', function(pot){
	document.getElementById("potTxt").innerText = pot;
});

var activeRoom = "";
socket.on('updateActiveRoom', function(room) {
    activeRoom = room
});
socket.on('populatedDeck', function(deck) {
    console.log(deck.length)
});

socket.on('notify', function(notification){
	document.getElementById("notification").innerText = notification;
});

socket.on('notifyBet', function(notification){
	document.getElementById("notification2").innerText = notification;
});

socket.on('nextTurn', function(betType) {
    socket.emit('updateTurn', activeRoom, betType);
		document.getElementById("notification").innerText = "It's your turn!";
});

function checkTurn() {
   socket.emit('userBet', activeRoom, 0);
}

socket.on('updateState', function (currentState){
	switch (currentState){
		case 1:
		dealBoard();
		break;
	}
});

function placeBet() {
    var betRegEx = /^[0-9]+/;
    var checkBet = document.getElementById("betAmountTxt").value;
    if (betRegEx.test(checkBet)) {
			if(pMoney >= checkBet){
	socket.emit('userBet', activeRoom, checkBet);
	pMoney = pMoney - parseInt(checkBet);
	document.getElementById("currentFundsText").innerText = pMoney;
			}
}}

socket.on('newPlayerHand', function(newHand) {
	playerHand=[];
    playerHand.push(newHand[0]);
    playerHand.push(newHand[1]);
    console.log(playerHand);
    dealHand();
});

function dealHand() {
    var playHand1Display = playerHand[0].card;
    var playHand2Display = playerHand[1].card;

    switch (playHand1Display) {
        case 1:
            playHand1Display = "a";
        case 14:
            playHand1Display = "a";
            break;
        case 11:
            playHand1Display = "j";
            break;
        case 12:
            playHand1Display = "q";
            break;
        case 13:
            playHand1Display = "k";
            break;
    }

    switch (playHand2Display) {
        case 1:
            playHand2Display = "a";
            break;
        case 14:
            playHand2Display = "a";
            break;
        case 11:
            playHand2Display = "j";
            break;
        case 12:
            playHand2Display = "q";
            break;
        case 13:
            playHand2Display = "k";
            break;
    }


    switch (playerHand[0].suit) {
        case "d":
            document.getElementById("pCard1").className = "card card-diamonds card-" + playHand1Display;
            pFlush.d++
            break;
        case "s":
            document.getElementById("pCard1").className = "card card-spades card-" + playHand1Display;
            pFlush.s++
            break;
        case "c":
            document.getElementById("pCard1").className = "card card-clubs card-" + playHand1Display;
            pFlush.c++
            break;
        case "h":
            document.getElementById("pCard1").className = "card card-hearts card-" + playHand1Display;
            pFlush.h++
            break;
    }

    switch (playerHand[1].suit) {
        case "d":
            document.getElementById("pCard2").className = "card card-diamonds card-" + playHand2Display;
            pFlush.d++
            break;
        case "s":
            document.getElementById("pCard2").className = "card card-spades card-" + playHand2Display;
            pFlush.s++
            break;
        case "c":
            document.getElementById("pCard2").className = "card card-clubs card-" + playHand2Display;
            pFlush.c++
            break;
        case "h":
            document.getElementById("pCard2").className = "card card-hearts card-" + playHand2Display;
            pFlush.h++
            break;
    }

    document.getElementById("cCard1").className = "card card-facedown";
    document.getElementById("cCard2").className = "card card-facedown";
    document.getElementById("bCard1").className = "card card-facedown";
    document.getElementById("bCard2").className = "card card-facedown";
    document.getElementById("bCard3").className = "card card-facedown";
    document.getElementById("bCard4").className = "card card-facedown";
    document.getElementById("bCard5").className = "card card-facedown";
    document.getElementById("alertTxt").innerText = "...";
}

socket.on('newBoard', function(b1, b2, b3) {
    board.push(b1);
    board.push(b2);
    board.push(b3);
    dealBoard();
});

function dealBoard() {
    var board1Display = board[0].card;
    switch (board1Display) {
        case 1:
            board1Display = "a";
            break;
        case 14:
            board1Display = "a";
            break;
        case 11:
            board1Display = "j";
            break;
        case 12:
            board1Display = "q";
            break;
        case 13:
            board1Display = "k";
            break;
    }

    switch (board[0].suit) {
        case "d":
            document.getElementById("bCard1").className = "card card-diamonds card-" + board1Display;
            break;
        case "s":
            document.getElementById("bCard1").className = "card card-spades card-" + board1Display;
            break;
        case "c":
            document.getElementById("bCard1").className = "card card-clubs card-" + board1Display;
            break;
        case "h":
            document.getElementById("bCard1").className = "card card-hearts card-" + board1Display;
            break;
    }


    var board2Display = board[1].card;

    switch (board2Display) {
        case 1:
            board2Display = "a";
            break;
        case 14:
            board2Display = "a";
            break;
        case 11:
            board2Display = "j";
            break;
        case 12:
            board2Display = "q";
            break;
        case 13:
            board2Display = "k";
            break;
    }

    switch (board[1].suit) {
        case "d":
            document.getElementById("bCard2").className = "card card-diamonds card-" + board2Display;
            break;
        case "s":
            document.getElementById("bCard2").className = "card card-spades card-" + board2Display;
            break;
        case "c":
            document.getElementById("bCard2").className = "card card-clubs card-" + board2Display;
            break;
        case "h":
            document.getElementById("bCard2").className = "card card-hearts card-" + board2Display;
            break;
    }


    var board3Display = board[2].card;

    switch (board3Display) {
        case 1:
            board3Display = "a";
            break;
        case 14:
            board3Display = "a";
            break;
        case 11:
            board3Display = "j";
            break;
        case 12:
            board3Display = "q";
            break;
        case 13:
            board3Display = "k";
            break;
    }

    switch (board[2].suit) {
        case "d":
            document.getElementById("bCard3").className = "card card-diamonds card-" + board3Display;
            break;
        case "s":
            document.getElementById("bCard3").className = "card card-spades card-" + board3Display;
            break;
        case "c":
            document.getElementById("bCard3").className = "card card-clubs card-" + board3Display;
            break;
        case "h":
            document.getElementById("bCard3").className = "card card-hearts card-" + board3Display;
            break;
    }
}

function dealCPU() {
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cpuHand[0] = pickedCard;
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cpuHand[1] = pickedCard;
}

socket.on('dealtTurn', function(b4){
	board[3]=b4;
	dealTurn();
});

function dealTurn() {
    var board4Display = board[3].card;
    switch (board4Display) {
        case 1:
            board4Display = "a";
            break;
        case 14:
            board4Display = "a";
            break;
        case 11:
            board4Display = "j";
            break;
        case 12:
            board4Display = "q";
            break;
        case 13:
            board4Display = "k";
            break;
    }

    switch (board[3].suit) {
        case "d":
            document.getElementById("bCard4").className = "card card-diamonds card-" + board4Display;
            pFlush.d++;
            cFlush.d++;
            break;
        case "s":
            document.getElementById("bCard4").className = "card card-spades card-" + board4Display;
            pFlush.s++;
            cFlush.s++;
            break;
        case "c":
            document.getElementById("bCard4").className = "card card-clubs card-" + board4Display;
            pFlush.c++;
            cFlush.c++;
            break;
        case "h":
            document.getElementById("bCard4").className = "card card-hearts card-" + board4Display;
            pFlush.h++;
            cFlush.h++;
            break;
    }
}

socket.on('dealtRiver', function(b5){
	board[4] = b5;
	dealRiver();
});

function dealRiver() {
    var board5Display = board[4].card;
    switch (board5Display) {
        case 1:
            board5Display = "a";
            break;
        case 14:
            board5Display = "a";
            break;
        case 11:
            board5Display = "j";
            break;
        case 12:
            board5Display = "q";
            break;
        case 13:
            board5Display = "k";
            break;
    }

    switch (board[4].suit) {
        case "d":
            document.getElementById("bCard5").className = "card card-diamonds card-" + board5Display;
            pFlush.d++;
            cFlush.d++;
            break;
        case "s":
            document.getElementById("bCard5").className = "card card-spades card-" + board5Display;
            pFlush.s++;
            cFlush.s++;
            break;
        case "c":
            document.getElementById("bCard5").className = "card card-clubs card-" + board5Display;
            pFlush.c++;
            cFlush.c++;
            break;
        case "h":
            document.getElementById("bCard5").className = "card card-hearts card-" + board5Display;
            pFlush.h++;
            cFlush.h++;
            break;
    }
}

socket.on('checkHands', function(card1, card2){
	cpuHand[0] = card1;
	cpuHand[1] = card2;
	document.getElementById("potTxt").innerText = 0;
	checkHands();
});

function checkHands() {
    var cpuHand1Display = cpuHand[0].card;
    var cpuHand2Display = cpuHand[1].card;

    switch (cpuHand1Display) {
        case 1:
            cpuHand1Display = "a";
            break;
        case 14:
            cpuHand1Display = "a";
            break;
        case 11:
            cpuHand1Display = "j";
            break;
        case 12:
            cpuHand1Display = "q";
            break;
        case 13:
            cpuHand1Display = "k";
            break;
    }

    switch (cpuHand2Display) {
        case 1:
            cpuHand2Display = "a";
            break;
        case 14:
            cpuHand2Display = "a";
            break;
        case 11:
            cpuHand2Display = "j";
            break;
        case 12:
            cpuHand2Display = "q";
            break;
        case 13:
            cpuHand2Display = "k";
            break;
    }


    switch (cpuHand[0].suit) {
        case "d":
            document.getElementById("cCard1").className = "card card-diamonds card-" + cpuHand1Display;
            cFlush.d++;
            break;
        case "s":
            document.getElementById("cCard1").className = "card card-spades card-" + cpuHand1Display;
            cFlush.s++;
            break;
        case "c":
            document.getElementById("cCard1").className = "card card-clubs card-" + cpuHand1Display;
            cFlush.c++;
            break;
        case "h":
            document.getElementById("cCard1").className = "card card-hearts card-" + cpuHand1Display;
            cFlush.h++;
            break;
    }

    switch (cpuHand[1].suit) {
        case "d":
            document.getElementById("cCard2").className = "card card-diamonds card-" + cpuHand2Display;
            cFlush.d++;
            break;
        case "s":
            document.getElementById("cCard2").className = "card card-spades card-" + cpuHand2Display;
            cFlush.s++;
            break;
        case "c":
            document.getElementById("cCard2").className = "card card-clubs card-" + cpuHand2Display;
            cFlush.c++;
            break;
        case "h":
            document.getElementById("cCard2").className = "card card-hearts card-" + cpuHand2Display;
            cFlush.h++;
            break;
    }
}