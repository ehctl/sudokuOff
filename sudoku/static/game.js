$(window).on("load", function () {
    console.log('Good luck 😇😇😇')

    var game = new Sudoku();
    game.setGameMode(GAME_MODE.EASY);
    setUpBoardGame(game);
});


var setUpBoardGame = (game,) => {
    bindEvent(game);
    genGameBoard(game);
};

var genGameBoard = (game) => {
    genGameGrid(game);
    genSelectGrid(game);
    fillGameGrid(game);
    startGame(game);
}

var genGameGrid = (game) => {
    $("#gameBoard").empty();
    var gridContainerArr = new Array(9);
    for (let i = 0; i < 9; i++) {
        var gridContainer = $('<div class="bold-border grid-container "></div>');
        gridContainerArr[i] = gridContainer;
        $("#gameBoard").append(gridContainer);
    }

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            div = $(`
                <div class="grid-item">
                    <div id='${genGridID(i, j)}' class='grid-detail'>0<div>
                </div>      
            `);

            div.on("click", () => {
                game.setChosenGrid(i, j);
            });
            gridContainerArr[i - i % 3 + Math.floor(j / 3)].append(div);
        }
    }

};

var genSelectGrid = (game) => {
    if ($("#selectBoard").children().length == 0)
        for (let i = 0; i < 9; i++) {
            var selectElem = $(`<div class="grid-item"> ${i + 1} </div>`);

            selectElem.on("click", () => {
                game.choose(i + 1);
            });
            $("#selectBoard").append(selectElem);
        }
};

var bindEvent = (game) => {
    $("#refreshImg").on("click", () => {
        var selectorValue = $('#difficultSelector').val();
        var gameMode = GAME_MODE.EASY;
        switch(selectorValue) {
            case 'Easy':    
                gameMode = GAME_MODE.EASY;
                break;
            case 'Medium':
                gameMode = GAME_MODE.MEDIUM;
                break;
            case 'Hard':
                gameMode = GAME_MODE.HARD;
                break;
        }
        game.setGameMode(gameMode);
        genGameBoard(game);
    });
};

var fillGameGrid = (game) => {
    mat = game.genGridValue();

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if(mat[i][j] != GRID_SPECIAL_VALUE.UNSET) 
                $(getGridID(i, j)).text(mat[i][j]);
            else
                $(getGridID(i, j)).css('visibility','hidden');
        }
    }

}

var startGame = (game) => {
    game.startTimer();
}

var hideLoading = () => $("#loadingContainer").hide();

var showLoading = () => $("#loadingContainer").show();

var getGridID = (x, y) => `#${genGridID(x, y)}`;

var genGridID = (x, y) => `grid_${x}_${y}`;

var setFailGridItem = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid").addClass("grid-item-failed");

var setSuccessGridItem = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid").addClass("grid-item-success");

var setGridText = (x, y, text) => $(getGridID(x, y)).text(text);

var setGridVisible = (x, y, isVisible = true) => $(getGridID(x, y)).css('visibility', isVisible ? 'visible' : 'hidden');

var selectGrid = (x, y) => $(getGridID(x, y)).parent().addClass("selected-grid");

var unselectGrid = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid");

var randomInt = (l, r) => Math.floor(Math.random() * (r + 1 - l) + l);

var deepCopy = (arr) => JSON.parse(JSON.stringify(arr));

var getTimerInterval = (game) => setInterval(() => {
    var remainingTime = game.getRemainingTime()
    if(remainingTime == "") {
        alert("Time's up! Nice try though")
        genGameBoard(game)
    } else
        $('#timer').text(game.getRemainingTime());
}, 500)

var congratulations = (message) => alert(message);

const GRID_SPECIAL_VALUE = {
    UNSET: 0,
    FAIL: -1,
    SUCCESS: -2
 };
Object.freeze(GRID_SPECIAL_VALUE);

const GAME_MODE_INDEX = {
    STR : 0,
    NUM_OF_EMPTY_GRID : 1,
    TIME : 2,
};
Object.freeze(GAME_MODE_INDEX);

const GAME_MODE = {
    EASY: ['Easy', 15, 20],
    MEDIUM: ['Medium', 30, 40],
    HARD: ['Hard', 40, 60]
};
Object.freeze(GAME_MODE);

class Sudoku {
    constructor() {
        this.curX = -1;
        this.curY = -1;
        this._mat = new Array(9).fill(0);
        this.mat = [];
        this.K = GAME_MODE.EASY[0];
        this.players = [];
        this.isSwapping = false;
        this.gameMode = GAME_MODE.EASY;
        this.filledGrid = 0;
        this.failedAttempt = 0;
        this.timer = new Timer();
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.K = mode[GAME_MODE_INDEX.NUM_OF_EMPTY_GRID];
    }

    getGameMode() {
        return this.gameMode;
    }

    genGridValue() {
        this.resetValues();
        this.initMat();
        this.fillDiagonal();
        this.fillRemaining(0, 3);
        this.printMat();
        this.mat = this.removeKDigits(deepCopy(this._mat));
        return this.mat;
    }

    startTimer() {
        this.timer.startCounting(this);
    }

    getRemainingTime() {
        return this.timer.getRemainingTime();
    } 

    resetValues() {
        this.filledGrid = 0;
    }

    getMat() {
        return this._mat;
    }

    initMat() {
        for(let i = 0; i < 9 ; i++) 
            this._mat[i] = new Array(9).fill(0);
    }

    printMat() {
        var out = ''
        for(let i=0; i < this._mat.length; i++) {
            for(let j=0; j < this._mat[i].length; j++) {
              out = out + this._mat[i][j] + ' ';
            }
            out += '\n';
        }
        console.log(out);
    }

    setChosenGrid(x, y) {
        unselectGrid(this.curX, this.curY);
        this.curX = x;
        this.curY = y;
        if(this.mat[x][y] != GRID_SPECIAL_VALUE.FAIL && this.mat[x][y] != GRID_SPECIAL_VALUE.SUCCESS)    
            selectGrid(this.curX, this.curY);
    }

    choose(value) {
        if (
            this.curX != -1 &&
            this.curY != -1 &&
            (this.mat[this.curX][this.curY] == GRID_SPECIAL_VALUE.UNSET || this.mat[this.curX][this.curY] == GRID_SPECIAL_VALUE.FAIL) 
        ) {
            setGridText(this.curX, this.curY, value);
            setGridVisible(this.curX, this.curY, true);
            if(!this.checkFillValidGrid(this.curX, this.curY, value)) {
                this.mat[this.curX][this.curY] = GRID_SPECIAL_VALUE.FAIL;
                this.failedAttempt++;                
                setFailGridItem(this.curX, this.curY);
            } else {
                this.mat[this.curX][this.curY] = GRID_SPECIAL_VALUE.SUCCESS;
                setSuccessGridItem(this.curX, this.curY);
                this.filledGrid += 1;
                if(this.checkWinConditions()) {
                    congratulations(`You WON. Congratulations!!! You just finished ${this.gameMode[GAME_MODE_INDEX.STR]} challenge in ${this.timer.getTimeSpent()}`);
                    genGameBoard(this);
                }
            }
        }
    }

    checkFillValidGrid(x, y, value){
        return this._mat[x][y] == value;
    }

    fillDiagonal() {
        for(let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
    }

    fillBox(row, col) {
        var num = 0
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                num = randomInt(1, 9);
                while(!this.checkBox(row, col, num))
                    num = randomInt(1, 9);
                this._mat[row + i][col + j] = num;
            }
        }
    }

    checkBox(row, col, num) {   
        for(let i = 0; i < 3; i++)
            for(let j = 0; j < 3; j++)
                if(this._mat[row + i][col + j] == num)
                    return false;
        return true;
    }

    fillRemaining(i, j){
        if(j >= 9 && i < 9-1){
            i++;
            j = 0;
        }

        if(i >= 9 && j >= 9)
            return true;

        if(i < 3) {
            if(j < 3) {
                j = 3;
            }
        }
        else if(i < 9 - 3) {
            if(j == Math.floor(i / 3) * 3){
                j += 3;
            }
        }
        else
            if(j == 9 - 3){
                i++;
                j = 0;
                if(i >= 9)
                    return true;
            }

            for(var num = 1; num < 10; num++) {
                if(this.checkIfSafe(i, j, num)) {
                    this._mat[i][j] = num;
                    if(this.fillRemaining(i, j+1))
                        return true;

                    this._mat[i][j] = 0;
            }
        }

        return false;
    }

    checkIfSafe(i, j, num) {
        return this.unUsedInRow(i, num) && 
                this.unUsedInCol(j, num) && 
                this.checkBox(i-i%3, j-j%3, num) ;
    }

    unUsedInRow(i, num) {
        for(let j = 0; j < 9; j++)
            if(this._mat[i][j] == num)
                return false;
        return true;
    }

    unUsedInCol(j, num) {
        for(let i = 0; i < 9; i++)
            if(this._mat[i][j] == num)
                return false;
        return true;
    }

    removeKDigits(matrix) {
        var count = this.K;
        while(count != 0) {
            var cellId = randomInt(0, 80);
            var i = Math.floor(cellId / 9);
            var j = cellId % 9;
            if(j != 0)
                j--;

            if(matrix[i][j] != 0){
                count -= 1;
                matrix[i][j] = GRID_SPECIAL_VALUE.UNSET;
            }
        }

        return matrix;
    }

    checkWinConditions() {
        return this.filledGrid == this.K;
    }

    getRemainingGrid() {
        return this.K - this.filledGrid;
    }
}

class Timer {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.coutingInterval = NaN;
    }

    startCounting(game) {
        this.startTime = Date.now();
        this.endTime = this.startTime + 1000 * 60 * game.getGameMode()[GAME_MODE_INDEX.TIME];

        clearInterval(this.coutingInterval);
        this.coutingInterval = getTimerInterval(game);
    }

    getRemainingTime() {
        var remainingTime = this.endTime - Date.now()
        return remainingTime > 0 ? this.formatTime1(remainingTime) : "";
    }

    getTimeSpent() {
        return this.formatTime2(Date.now() - this.startTime);
    }

    formatTime1(time) {
        var seconds = ('0' + Math.floor((time / 1000) % 60).toString()).slice(-2);
        var minutes = ('0' + Math.floor((time / 1000 / 60) % 60)).toString().slice(-2);
        var hours = ('0' + Math.floor((time / (1000 * 60 * 60)) % 24).toString()).slice(-2);
        return `${hours} : ${minutes} : ${seconds}`;
    }
    
    formatTime2(time) {
        var seconds = Math.floor((time / 1000) % 60).toString();
        var minutes = Math.floor((time / 1000 / 60) % 60);
        var hours = Math.floor((time / (1000 * 60 * 60)) % 24);
        return `${hours} hour, ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}, ${seconds} ${seconds > 1 ? 'seconds' : 'second'}`;
    }

}

