var viewportWidth;
var viewportWidth;
var scoresList;
var gameTime = 30;
var Keys = {
	left: false,
	right: false
};

// Returns width of the viewable portion of the window.
function getWindowWidth() {
	return (window.innerWidth > 0) ? $(window).width() : screen.width;
}

// Returns height of the viewable portion of the window.
function getWindowHeight() {
	return (window.innerHeight > 0) ? $(window).height() : screen.height;
}

$(function() {
	attachEventHandlers();
	scoresList = localStorage.getItem("scores");
	scoresList = JSON.parse(scoresList);
	if (scoresList == null || scoresList.length == 0) {
		scoresList = new Array();
	}
	$("#timeLeft").text(gameTime);
	populateScoreboard();
	// Store initial values of window height and width
	viewportWidth = getWindowWidth();
	viewportHeight = getWindowHeight();
});

function attachEventHandlers() {
	// Whenever the window is resized, recalculate the viewport width/height.
	// This is so the images bounce off the walls correctly.
	$(window).resize(function() {
		viewportWidth = getWindowWidth();
		viewportHeight = getWindowHeight();
	});

	$(".bill").on('click touchstart tap taphold mousedown', function(event) {
		event.preventDefault();
	});

	window.oncontextmenu = function(event) {
    	event.preventDefault();
     	event.stopPropagation();
     	return false;
	};

	// If user hit start button, start the countdown.
	$("#begin").click(function() {
		$("#begin").hide();
		startCountdown();
	});

	$("#clickBtn").click(function() {
		alert(viewportHeight + ", " + viewportWidth);
	});

	// Update Keys to show what key was pressed.
	$(document).keydown(function(event) {
		switch (event.keyCode) {
			case 37:
				Keys.left = true;
				break;
			case 39:
				Keys.right = true;
				break;
		}
	});

	// Update Keys to show what was unpressed.
	$(document).keyup(function(event) {
		var keyCode = event.keyCode;
		if (keyCode == "37") Keys.left = false;
		if (keyCode == "39") Keys.right = false;
	});

	// Move trash can to the left or right based on whether their mouse is
	// to the left or right of the trash can.
	$(document).bind("mousedown touchstart", function(event) {
		var tappedX;
		if (event.type == 'touchstart') tappedX = event.originalEvent.touches[0].pageX;
		else tappedX = event.clientX;

		if (tappedX > (viewportWidth / 2)) {
			Keys.right = true;
		} else {
			Keys.left = true;
		}
	});

	// If they let go of the mouse, stop moving trash can.
	$(document).on("mouseup touchend", function(event) {
		Keys.left = false;
		Keys.right = false;
	});

	// Begin page two event handlers
	$("#pageOneBtn").click(function() {
		score = 0;
		sum = 0;
		gameTime = 30;
		count = 3;
		$("#score").text("0");
		$("#timeLeft").text("30");
		$("#begin").show();
	});

	// Save scores into local storage
	$(window).unload(function() {
		localStorage.scores = JSON.stringify(scoresList);
	});
}

// Keep checking for arrow key presses every 5ms.
setInterval(function() {
	detectMovement();
}, 5);

// Check for if they are resizing the window such that the trash can 
// is outside of the window. if they are, change the position of the trash can.
setInterval(function () {
	if (parseInt($("#trash").css("left")) > viewportWidth) {
		$("#trash").css("left", (viewportWidth - $("#trash").outerWidth()) + 'px');
	}
}, 100);

// Call appropriate methods based on whether left arrow key or right arrow key was pressed
function detectMovement() {
	if (Keys.left) leftArrowPressed();
	if (Keys.right) rightArrowPressed();
}

// Move trash can to left
function leftArrowPressed() {
	var trashCan = document.getElementById("trash");
	var leftPosition = parseInt($("#trash").css("left"));
	var moveLength = amountToMove();
	if ((leftPosition - moveLength) > 0) {
		trashCan.style.left = (leftPosition - moveLength) + 'px';
	}
}

// Move trash can to right
function rightArrowPressed() {
	var trashCan = document.getElementById("trash");
	var trashCanWidth = $("#trash").outerWidth();
	var leftPosition = parseInt($("#trash").css("left"));
	var moveLength = amountToMove();
	if ((leftPosition + moveLength + trashCanWidth) < viewportWidth) {
		trashCan.style.left = (leftPosition + moveLength) + 'px';
	}
}

function amountToMove() {
	return Math.floor(viewportWidth/200);
}

class MoneyGroup {
	constructor() {
		this.numMoneys = 0;
		this.list = new Object();
	}

	// Move each money in the list one unit in it's current direction
	moveAll() {
		var moneyGroupReference = this;
		$.each(this.list, function(moneyNumber, moneyObj) {
			if (checkOverlap(moneyObj)) {
				var oldScore = getScore();
				var newScore = oldScore + moneyObj.dollars;
				$("#score").text(newScore);
				moneyGroupReference.removeMoneyFromList(moneyNumber);
				$(moneyObj.image).remove();
			} else {
				moneyObj.move();
			}
		});
	}

	// Adds the specified money object to the list
	addToList(money) {
		$(this.list).prop(this.numMoneys++, money);
	}

	// Unique identifier will be the number of money objects we've created so far.
	getNewMoneyNumber() {
		return this.numMoneys;
	}

	// Remove the specified money object from the list of money we need to move.
	removeMoneyFromList(moneyNumber) {
		$(this.list).removeProp(moneyNumber);
	}

	// Call remove method on all money objects in the list and delete them off the screen.
	removeAllMoney() {
		var moneyGroupReference = this;
		$.each(this.list, function(moneyNumber, moneyObj) {
			moneyGroupReference.removeMoneyFromList(moneyNumber);
			$(moneyObj.image).remove();
		});
	}
}

var moneyGroup = new MoneyGroup();

class Money {
	constructor(x, y, dirX, dirY) {
		this.n = moneyGroup.getNewMoneyNumber();
		this.x = x;
		this.y = y;
		this.dirX = dirX;
		this.dirY = dirY;
		this.image = null;
		moneyGroup.addToList(this);
	}

	launch() {
		var moneyType = getRandomMoneyType();
		var imageElement = $("<img class='bill' src='" + moneyType + "'>");
		$(imageElement).attr("id", "b" + this.n);
		$(imageElement).css({
			"position": "absolute",
			"max-height": "90px",
			"max-width": "90px"
		});
		// Add the image to the body
		$("body").append(imageElement);

		// Save dollar amount of how much this image is worth
		this.dollars = parseInt(moneyType);
		if (this.dollars == 100) this.xDir = 4;
		// Save reference to image element as instance property
		this.image = document.getElementById("b" + this.n);
		// Start the animation timer if this is the first money.
		if (this.n <= 0)
			timer();
	}

	move() {
		// Recalculate direction of the money.
		if (this.x + $(this.image).outerWidth() >= (viewportWidth)) this.dirX = -this.dirX;
		if (this.y + $(this.image).outerHeight() >= viewportHeight) $(this.image).remove(); //this.dirY = -this.dirY;
		if (this.x <= 0) this.dirX = -this.dirX;
		if (this.y <= 0) this.dirY = -this.dirY;
		//alert(this.dirX + ", " + this.dirY);
		// Update the coordinates.
		this.x += this.dirX;
		this.y += this.dirY;

		// Reposition the money Image.
		$(this.image).css("left", this.x + "px");
		$(this.image).css("top", this.y + "px");
	}
}

// Update the position of the images every millisecond
function timer() {
	moneyGroup.moveAll();
	setTimeout("timer()", 2);
}


var randomizer1 = 1;
var randomizer2 = 2;
var randomizer3 = 3;
var edgeRandomizer = 9;
// Create a new money object and set it in motion.
function addMoney() {
	var startXCoordinate = getRandomXCoordinateWithinViewport();
	var startYCoordinate = getRandomYCoordinateWithinViewport();
	var random = 1 == (Math.round(Math.random()));
	var xDir = random == true ? 2 : -2;
	// 2 by default
	var yDir = 2;
	if (randomizer1++ % 4 == 0) {
		xDir = 0;
		yDir = 4;
	}
	if (randomizer2++ % 5 == 0) xDir = random == true ? 3 : -3;
	if (randomizer3++ % 6 == 0) xDir = random == true ? 4 : -4;
	if (edgeRandomizer++ % 4 == 0) startXCoordinate = 2;
	var money = new Money(startXCoordinate, 1, xDir, yDir);
	money.launch();
}

// Sum is total milliseconds gone by.
var sum = 0;

// Spawns dollars for how many seconds were passed in until sum is greater than seconds.
function startMoney(seconds) {
	// Next dollar bill will spawn in some time between .5 and 1 seconds
	var milliseconds = (Math.floor(Math.random() * (1000 - 400))) + 500;
	setTimeout(function() {
		if (sum < (seconds * 1000)) {
			sum += milliseconds;
			addMoney();
			startMoney(seconds);
		}
	}, milliseconds);
}

// Counts down every second for the countdown timer to start after 3 seconds.
function startCountdown() {
	var countdownTimer;
	var count = 3;
	countdownTimer = setInterval(function() {
		handleTimer(count);
	}, 1000);

	// Changes the display of the countdown until it reaches 0, then it clears
	// the countdown and allows for money to begin dropping.
	function handleTimer() {
		if (count === 0) {
			clearInterval(countdownTimer);
			// Start dropping money
			startMoney(gameTime);
			// Tell game timer the game is starting for specified time.
			startGameTimer();
			$("#count_num").html("");
		} else {
			$('#count_num').html(count--);
		}
	}
}

// Starts the timer for the game. Counts down every second.
function startGameTimer() {
	var timeLeftTimer;
	timeLeftTimer = setInterval(function() {
		startTimer(gameTime);
	}, 1000);

	// Changes the time left on the page and when the time reaches 0,
	// we clear all money off the screen, add the current score
	// to the list of scores, then change to page two to show the scoreboard
	// of the top 5 scores they've had.
	function startTimer() {
		if (gameTime === 0) {
			clearInterval(timeLeftTimer);
			moneyGroup.removeAllMoney();
			var mostRecentScore = getScore();
			scoresList.push(mostRecentScore);
			$.mobile.changePage("#two");
			showMostRecentScore(mostRecentScore);
			populateScoreboard();
		} else {
			$("#timeLeft").html(--gameTime);
		}
	}
}

// Returns a string signifying the dollar bill type. Supports higher chances of lower bills.
function getRandomMoneyType() {
	var randomNumber = Math.floor(Math.random() * (100));
	return pickRandomImage(randomNumber);

	function pickRandomImage(number) {
		if (number < 35) return "1.jpeg";
		if (number < 50) return "5.jpeg";
		if (number < 70) return "10.jpeg";
		if (number < 80) return "20.jpeg";
		if (number < 93) return "50.jpeg";
		else return "100.jpeg";
	}
}

// Returns a random X coordinate within the viewport width.
function getRandomXCoordinateWithinViewport() {
	return Math.floor(Math.random() * (viewportWidth - 97)) + 5;
}

// Returns a random Y coordinate within the viewport height.
function getRandomYCoordinateWithinViewport() {
	return Math.floor(Math.random() * (viewportHeight - 30));;
}

function getScore() {
	return parseInt($("#score").text());
}

// Checks overlap between the trash can and the object passed in. If they overlap, returns true
function checkOverlap(dollarObj) {
	var trashCanTop = $("#trash").offset().top;
	var trashCanLeft = $("#trash").offset().left;
	var trashCanWidth = $("#trash").width();
	var trashCanHeight = $("#trash").height();
	var dollarObjTop = $(dollarObj.image).offset().top;
	var dollarObjLeft = $(dollarObj.image).offset().left;
	var dollarObjWidth = $(dollarObj.image).outerWidth();
	var dollarObjHeight = $(dollarObj.image).outerHeight();

	if (
		(trashCanLeft > (dollarObjLeft + dollarObjWidth)) ||
		(dollarObjLeft > (trashCanLeft + trashCanWidth))) {
		return false;
	}
	if (
		(trashCanTop > (dollarObjTop + dollarObjHeight)) ||
		(dollarObjTop > (trashCanTop + trashCanHeight))) {
		return false;
	}
	return true;
}

function showMostRecentScore(mostRecentScore) {
	$("#mostRecentScore").text("You scored " + mostRecentScore + "!");
}

// Displays top 5 scores.
function populateScoreboard() {
	$("#scoreboard tr td").remove();
	// sorts in reverse
	scoresList.sort(function(a, b) {
		return b - a
	});
	// Keep only first 5.
	scoresList = scoresList.slice(0, 5);
	var i = 0;
	for (; i < scoresList.length && (scoresList[i] != null && scoresList[i] != undefined); i++) {
		var row = $("<tr></tr>");
		var cell1 = $("<td><h3>" + (i + 1) + "</h3></td>");
		$(row).append(cell1);
		var cell2 = $("<td><h3>" + scoresList[i] + "</h3></td>");
		$(row).append(cell2);
		$("#scoreboard").append(row);
	}
}