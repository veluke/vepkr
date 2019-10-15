var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var express = require('express');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/poker.html');
});

var player1 = "";
var player2 = "";

var games = [];
var rooms = [];
var users = {};
var turns = [];

io.on('connection', function(socket) {
    console.log(socket.id + ' connected');
    for (var i = 0; i < rooms.length; i++) {
        socket.emit('roomUpdate', rooms[i]);
    }
    socket.on('disconnect', function() {
        console.log(socket.id + ' disconnected');
    });

    socket.on("create_room", room => {
        for (var i = 0; i < rooms.length; i++) {
            if (rooms[i] == room) {
                console.log("room already exists");
                return;
            }
        }
        socket.join(room);
        socket.emit('updateActiveRoom', room);
        turns.push({
            'room': room,
            'turn': socket.id,
			'pot' : 0,
			'currentbet' : -1,
			'state' : 0,
			'winner' : "",
			'p1funds' : 100,
			'p2funds' : 100,
			
        });
        rooms.push(room);
        users.room = 1;
        console.log(socket.id + ' joined ' + room + " | " + users.room);
        player1 = socket.id;
        console.log("player 1 = " + player1);
        io.emit('roomUpdate', room);
    });

    socket.on("join_room", room => {
        let userRooms = Object.keys(socket.rooms);
        for (var i = 0; i < userRooms.length; i++) {
            if (userRooms[i] == room) {
                console.log("user is already in this room");
                return;
            }
        }
        if (users.room < 2) {
            player2 = socket.id;
            console.log("player 2 = " + player2);
            socket.join(room);
            socket.emit('updateActiveRoom', room);
            users.room++;
            console.log(socket.id + ' joined ' + room + " | " + users.room);

        } else if (users.room = 2) {
            console.log("room is full");
        }
        if (users.room == 2) {
            startNewGame(room);
        }
    });

    socket.on('disconnecting', function() {
        let userRooms = Object.keys(socket.rooms);
        for (var i = 1; i < userRooms.length; i++) {
            var room = userRooms[i];
            users.room = users.room - 1;
            console.log(socket.id + " left " + room + " | " + users.room);
        }
    });

    function nextTurn(room, betType) {
        console.log('nextTurn was called (' + betType +')');
        socket.to(room).emit('nextTurn', betType);
    }

    socket.on('updateTurn', function(activeRoom, betType) {
        updating = 0;
        var currentTurn = findKey(turns, 'room', activeRoom);
		var currentGame = findKey(games, 'room', activeRoom);
        currentTurn.turn = socket.id;
        console.log('updateTurn: ' + currentTurn.turn);
		var pot = findKey(turns, 'room', activeRoom).pot;
		io.to(activeRoom).emit('updatePot',pot);
		switch (betType){
			case 'call':
			currentTurn.state++;
			switch (currentTurn.state){
				case 1:
				io.to(activeRoom).emit('newBoard', currentGame.b1, currentGame.b2, currentGame.b3);
				currentTurn.currentbet = -1;
				break;
				case 2:
				io.to(activeRoom).emit('dealtTurn', currentGame.b4);
				currentTurn.currentbet = -1;
				break;
				case 3:
				io.to(activeRoom).emit('dealtRiver', currentGame.b5);
				currentTurn.currentbet = -1;
				break;
				case 4:
				
				if(currentTurn.winner != "split"){
				var winner = currentTurn.winner;
				io.to(winner).emit("claimPrize", currentTurn.pot);
				currentTurn.pot = 0;
				}
				
				else if (currentTurn.winner == "split"){
				io.to(activeRoom).emit('splitPrize', currentTurn.pot * 0.5);
				currentTurn.pot = 0;
				}
				
				io.to(player1).emit('checkHands', currentGame.p2a, currentGame.p2b);
				io.to(player2).emit('checkHands', currentGame.p1a, currentGame.p1b);
				currentTurn.currentbet = -1;
				currentTurn.state = 0;
				populateDeck(activeRoom);	
			}
			break;
		}
    });


	socket.on('userBet', function(activeRoom, bet) {
        var activeTurn = findKey(turns, 'room', activeRoom);
        if (activeTurn.turn == socket.id) {
			if (bet > activeTurn.currentbet){
				if (activeTurn.currentbet == -1){activeTurn.currentbet = 0};
				var betDiff = (parseInt(bet) - activeTurn.currentbet)
			io.to(activeRoom).emit('updateBet', betDiff);
			console.log(socket.id + " raised bet: " + betDiff);
			activeTurn.pot = parseInt(activeTurn.pot) + parseInt(bet);
			console.log("current pot: " + activeTurn.pot);
			activeTurn.currentbet = parseInt(betDiff);
			nextTurn(activeRoom, 'raise');
			}
			else if (bet == activeTurn.currentbet){
				io.to(activeRoom).emit('updateBet', 0);
			console.log(socket.id + " called bet: " + bet);
			activeTurn.pot = parseInt(activeTurn.pot) + parseInt(bet);
			console.log("current pot: " + activeTurn.pot);
			activeTurn.currentbet = parseInt(bet);
			nextTurn(activeRoom, 'call');
			}
	}});

    socket.on('userTurn', function(activeRoom, turnID) {
        var activeTurn = findKey(turns, 'room', activeRoom);
        if (activeTurn.turn == socket.id) {
			switch(turnID){
			case "fold":
			console.log(socket.id + " folded.");
            nextTurn(activeRoom, 'fold');
			populateDeck(activeRoom);
				break;
			}
        }
    })
});

function findKey(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            return array[i];
        }
    }
    return null;
}

http.listen(66, function() {
    console.log('listening on *:66');
});

function startNewGame(room) {
    console.log("starting new game in " + room);
    populateDeck(room);
}


function populateDeck(room) {
	io.to(room).emit("startNewHand");
    deck = [];
    cards = {};
    p1 = [];
    p1Flush = {
        'h': 0,
        'c': 0,
        's': 0,
        'd': 0
    };
    p2 = [];
    p2Flush = {
        'h': 0,
        'c': 0,
        's': 0,
        'd': 0
    };
    board = [];
    cards.room = room;
    var newHand = [];

    for (var i = 1; i < 14; i++) {
        deck.push({
            "suit": "d",
            "card": i
        });
    }
    for (var i = 1; i < 14; i++) {
        deck.push({
            "suit": "s",
            "card": i
        });
    }
    for (var i = 1; i < 14; i++) {
        deck.push({
            "suit": "c",
            "card": i
        });
    }
    for (var i = 1; i < 14; i++) {
        deck.push({
            "suit": "h",
            "card": i
        });
    }
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    newHand[0] = pickedCard;
    cards.p1a = pickedCard;
    p1.push(pickedCard);
    switch (pickedCard.suit) {
        case 'h':
            p1Flush.h++;
            break;
        case 'd':
            p1Flush.d++;
            break;
        case 'c':
            p1Flush.c++;
            break;
        case 's':
            p1Flush.s++;
            break;
    }
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    newHand[1] = pickedCard;
    cards.p1b = pickedCard;
    switch (pickedCard.suit) {
        case 'h':
            p1Flush.h++;
            break;
        case 'd':
            p1Flush.d++;
            break;
        case 'c':
            p1Flush.c++;
            break;
        case 's':
            p1Flush.s++;
            break;
    }
    p1.push(pickedCard);
    io.to(player1).emit('newPlayerHand', newHand);
    console.log("sent new hand to " + player1);

    var newHand = [];
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    newHand[0] = pickedCard;
    cards.p2a = pickedCard;
    switch (pickedCard.suit) {
        case 'h':
            p2Flush.h++;
            break;
        case 'd':
            p2Flush.d++;
            break;
        case 'c':
            p2Flush.c++;
            break;
        case 's':
            p2Flush.s++;
            break;
    }
    p2.push(pickedCard);
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    newHand[1] = pickedCard;
    cards.p2b = pickedCard;
    p2.push(pickedCard);
    switch (pickedCard.suit) {
        case 'h':
            p2Flush.h++;
            break;
        case 'd':
            p2Flush.d++;
            break;
        case 'c':
            p2Flush.c++;
            break;
        case 's':
            p2Flush.s++;
            break;
    }
    io.to(player2).emit('newPlayerHand', newHand);
    console.log("sent new hand to " + player2);
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cards.b1 = pickedCard;
    board.push(pickedCard);
    switch (pickedCard.suit) {
        case 'h':
            p1Flush.h++;
            p2Flush.h++;
            break;
        case 'd':
            p1Flush.d++;
            p2Flush.d++;
            break;
        case 'c':
            p1Flush.c++;
            p2Flush.c++;
            break;
        case 's':
            p1Flush.s++;
            p2Flush.s++;
            break;
    }
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cards.b2 = pickedCard;
    board.push(pickedCard);
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cards.b3 = pickedCard;
    board.push(pickedCard);
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cards.b4 = pickedCard;
    board.push(pickedCard);
    var cardPosition = Math.floor(Math.random() * deck.length);
    var pickedCard = deck[cardPosition];
    deck.splice(cardPosition, 1);
    cards.b5 = pickedCard;
    board.push(pickedCard);
    console.log(cards);
	cards.pot = 0;
    games.push(cards);
    console.log(games);
	
    var currentGame = findKey(games, 'room', room);
	currentGame.turn = 1;

    p1straight = 0;
    p2straight = 0;
    p1Arr = [];
    p2Arr = [];
    var p1Score = 0;
    var p2Score = 0;

    //player1Check
    for (i = 0; i < p1.length; i++) {
        p1Arr.push(parseInt(p1[i].card));
    }

    for (i = 0; i < board.length; i++) {
        p1Arr.push(parseInt(board[i].card));
    }

    p1Arr.sort(function(a, b) {
        return a - b;
    });

    var p1results = [];
    var pairs1Object = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0
    };
    var pairs1 = {
        count: 0,
        score: 0
    };
    var threes1 = {
        count: 0,
        score: 0
    };
    var quads1 = {
        count: 0,
        score: 0
    };


    for (var i = 0; i < p1Arr.length; i++) {
        cardNumber = p1Arr[i];
        pairs1Object[cardNumber]++;
    }

    for (var x = 0; x < p1Arr.length; x++) {
        if (p1Arr[x] == p1Arr[x + 1]) {
            p1Arr.splice(x, 1);
        }
    }

    for (var i = 0; i < p1Arr.length; i++) {
        if (p1Arr[i] + 1 == p1Arr[i + 1] && p1Arr[i] + 2 == p1Arr[i + 2] && p1Arr[i] + 3 == p1Arr[i + 3] && p1Arr[i] + 4 == p1Arr[i + 4]) {
            p1results.push(p1Arr[i]);
        }
    }

    for (var i = 1; i < 13; i++) {
        if (pairs1Object[i] == 2) {
            pairs1.count++;
            pairs1.score = pairs1.score + i;
            p1Score = p1Score + (i + 14);
        }

        if (pairs1Object[i] == 3) {
            threes1.count++;
            threes1.score = threes1.score + i;
            p1Score = p1Score + (i * 100);
        }

        if (pairs1Object[i] == 4) {
            quads1.count++;
            quads1.score = quads1.score + i;
            p1Score = p1Score + (i * 1000);
        }
    }

    for (var i = 0; i < p1results.length; i++) {
        var p1straight = p1results[i];
        p1Score = (p1straight * 10000);
    }

    if (p1Flush.h >= 5 || p1Flush.c >= 5 || p1Flush.s >= 5 || p1Flush.d >= 5) {
        if (p1results.length > 0) {
            p1Score = 2000000 * p1results[p1results.length - 1];
        } else if (p1results.length == 0) {
            p1Score = 1000000
        };
    }

    //player2Check
    for (i = 0; i < p2.length; i++) {
        p2Arr.push(parseInt(p2[i].card));
    }

    for (i = 0; i < board.length; i++) {
        p2Arr.push(parseInt(board[i].card));
    }

    p2Arr.sort(function(a, b) {
        return a - b;
    });

    var p2results = [];
    var pairs2Object = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0
    };
    var pairs2 = {
        count: 0,
        score: 0
    };
    var threes2 = {
        count: 0,
        score: 0
    };
    var quads2 = {
        count: 0,
        score: 0
    };


    for (var i = 0; i < p2Arr.length; i++) {
        cardNumber = p2Arr[i];
        pairs2Object[cardNumber]++;
    }

    for (var x = 0; x < p2Arr.length; x++) {
        if (p2Arr[x] == p2Arr[x + 1]) {
            p2Arr.splice(x, 1);
        }
    }

    for (var i = 0; i < p2Arr.length; i++) {
        if (p2Arr[i] + 1 == p2Arr[i + 1] && p2Arr[i] + 2 == p2Arr[i + 2] && p2Arr[i] + 3 == p2Arr[i + 3] && p2Arr[i] + 4 == p2Arr[i + 4]) {
            p2results.push(p2Arr[i]);
        }
    }

    for (var i = 1; i < 13; i++) {
        if (pairs2Object[i] == 2) {
            pairs2.count++;
            pairs2.score = pairs2.score + i;
            p2Score = p2Score + (i + 14);
        }

        if (pairs2Object[i] == 3) {
            threes2.count++;
            threes2.score = threes2.score + i;
            p2Score = p2Score + (i * 100);
        }

        if (pairs2Object[i] == 4) {
            quads2.count++;
            quads2.score = quads2.score + i;
            p2Score = p2Score + (i * 1000);
        }
    }

    for (var i = 0; i < p2results.length; i++) {
        var p2straight = p2results[i];
        p2Score = (p2straight * 10000);
    }

    if (p2Flush.h >= 5 || p2Flush.c >= 5 || p2Flush.s >= 5 || p2Flush.d >= 5) {
        if (p2results.length > 0) {
            p2Score = 2000000 * p2results[p2results.length - 1];
        } else if (p2results.length == 0) {
            p2Score = 1000000
        };
    }
    console.log(p1Score);
	
    console.log(p2Score);
	
	var currentTurn = findKey(turns, 'room', room);
	
	if (p1Score > p2Score) {
		currentTurn.winner = player1;
        console.log("player 1 wins");

    } else if (p1Score < p2Score) {
		currentTurn.winner = player2;
        console.log("player 2 wins");

    } else if (p1Score == p2Score) {
        p1Total = [];
        p2Total = [];

        for (var i = 0; i < p1.length; i++) {
            p1Total.push(p1[i].card);
        }

        for (var i = 0; i < p2.length; i++) {
            p2Total.push(p2[i].card);
        }

        p1Total.sort(function(a, b) {
            return a - b;
        });
        p2Total.sort(function(a, b) {
            return a - b;
        });

        var p1Kicker = p1Total[p1Total.length - 1];
        var p2Kicker = p2Total[p2Total.length - 1];

        if (p1Kicker == p2Kicker) {
            p1Kicker = p1Total[p1Total.length - 2];
            p2Kicker = p2Total[p2Total.length - 2];
        }

        if (p1Kicker > p2Kicker) {
			
            console.log("player 1 wins");
			currentTurn.winner = player1;
        } else if (p1Kicker < p2Kicker) {
            console.log("player 2 wins");
			currentTurn.winner = player2;
        } else if (p1Kicker == p2Kicker) {
            console.log("split pot");
			currentTurn.winner = "split";
        }
    }
}