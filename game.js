$(window).on("load", function () {
    let game = new Sudoku()
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
}

var genGameGrid = (game) => {
    $("#gameBoard").empty();
    let gridContainerArr = new Array(9)
    for (let i = 0; i < 9; i++) {
        let gridContainer = $('<div class="bold-border grid-container "></div>');
        gridContainerArr[i] = gridContainer
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
            gridContainerArr[i - i % 3 + Math.floor(j / 3)].append(div)
        }
    }

};

var genSelectGrid = (game) => {
    if ($("#selectBoard").children().length == 0)
        for (let i = 0; i < 9; i++) {
            let selectElem = $(`<div class="grid-item"> ${i + 1} </div>`);

            selectElem.on("click", () => {
                game.choose(i + 1);
            });
            $("#selectBoard").append(selectElem);
        }
};

var bindEvent = (game) => {
    $("#replayButton").on("click", () => {
        genGameBoard(game);
    });
};

var fillGameGrid = (game) => {
    mat = game.genGridValue()

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if(mat[i][j] != GRID_SPECIAL_VALUE.UNSET) 
                $(getGridID(i, j)).text(mat[i][j])
            else
                $(getGridID(i, j)).css('visibility','hidden')
        }
    }
}

class Sudoku {
    constructor() {
        this.curX = -1;
        this.curY = -1;
        this._mat = new Array(9).fill(0);
        this.mat = [];
        this.K = 30;
        this.players = [];
        this.isSwapping = false;
    }

    genGridValue() {
        this.initMat()
        this.fillDiagonal()
        this.fillRemaining(0, 3)
        this.printMat()
        this.mat = this.removeKDigits(deepCopy(this._mat))
        return this.mat
    }

    getMat() {
        return this._mat
    }

    initMat() {
        for(let i = 0; i < 9 ; i++) 
            this._mat[i] = new Array(9).fill(0);
    }

    printMat() {
        let out = ''
        for(let i=0; i < this._mat.length; i++) {
            for(let j=0; j < this._mat[i].length; j++) {
              out = out + this._mat[i][j] + ' ';
            }
            out += '\n'
        }
        console.log(out);
    }

    setChosenGrid(x, y) {
        unselectGrid(this.curX, this.curY)
        this.curX = x
        this.curY = y
        if(this.mat[x][y] != GRID_SPECIAL_VALUE.FAIL && this.mat[x][y] != GRID_SPECIAL_VALUE.SUCCESS)    
            selectGrid(this.curX, this.curY)
    }

    choose(value) {
        if (
            this.curX != -1 &&
            this.curY != -1 &&
            (this.mat[this.curX][this.curY] == GRID_SPECIAL_VALUE.UNSET || this.mat[this.curX][this.curY] == GRID_SPECIAL_VALUE.FAIL) 
        ) {
            setGridText(this.curX, this.curY, value)
            setGridVisible(this.curX, this.curY, true)
            if(!this.checkFillValidGrid(this.curX, this.curY, value)) {
                this.mat[this.curX][this.curY] = GRID_SPECIAL_VALUE.FAIL
                setFailGridItem(this.curX, this.curY)
            } else {
                this.mat[this.curX][this.curY] = GRID_SPECIAL_VALUE.SUCCESS
                setSuccessGridItem(this.curX, this.curY)
            }
        }
    }

    checkFillValidGrid(x, y, value){
        return this._mat[x][y] == value
    }

    fillDiagonal() {
        for(let i = 0; i < 9; i += 3) {
            this.fillBox(i, i)
        }
    }

    fillBox(row, col) {
        let num = 0
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                num = randomInt(1, 9)
                while(!this.checkBox(row, col, num))
                    num = randomInt(1, 9)
                this._mat[row + i][col + j] = num
            }
        }
    }

    checkBox(row, col, num) {
        for(let i = 0; i < 3; i++)
            for(let j = 0; j < 3; j++)
                if(this._mat[row + i][col + j] == num)
                    return false
        return true
    }

    fillRemaining(i, j){
        if(j >= 9 && i < 9-1){
            i++;
            j = 0;
        }

        if(i >= 9 && j >= 9)
            return true

        if(i < 3) {
            if(j < 3) {
                j = 3
            }
        }
        else if(i < 9 - 3) {
            if(j == Math.floor(i / 3) * 3){
                j += 3
            }
        }
        else
            if(j == 9 - 3){
                i++
                j = 0
                if(i >= 9)
                    return true
            }

            for(let num = 1; num < 10; num++) {
            if(this.checkIfSafe(i, j, num)) {
                this._mat[i][j] = num
                if(this.fillRemaining(i, j+1))
                    return true

                this._mat[i][j] = 0
            }
        }

        return false
    }

    checkIfSafe(i, j, num) {
        return this.unUsedInRow(i, num) && 
                this.unUsedInCol(j, num) && 
                this.checkBox(i-i%3, j-j%3, num) 
    }

    unUsedInRow(i, num) {
        for(let j = 0; j < 9; j++)
            if(this._mat[i][j] == num)
                return false
        return true
    }

    unUsedInCol(j, num) {
        for(let i = 0; i < 9; i++)
            if(this._mat[i][j] == num)
                return false
        return true
    }

    removeKDigits(matrix) {
        let count = this.K
        while(count != 0) {
            let cellId = randomInt(0, 80)
            let i = Math.floor(cellId / 9)
            let j = cellId % 9
            if(j != 0)
                j--;

            if(matrix[i][j] != 0){
                count -= 1
                matrix[i][j] = GRID_SPECIAL_VALUE.UNSET
            }
        }

        return matrix
    }
}

var hideLoading = () => $("#loadingContainer").hide();

var showLoading = () => $("#loadingContainer").show();

var getGridID = (x, y) => `#${genGridID(x, y)}`

var genGridID = (x, y) => `grid_${x}_${y}`

var setFailGridItem = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid").addClass("grid-item-failed");

var setSuccessGridItem = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid").addClass("grid-item-success");

var setGridText = (x, y, text) => $(getGridID(x, y)).text(text);

var setGridVisible = (x, y, isVisible = true) => $(getGridID(x, y)).css('visibility', isVisible ? 'visible' : 'hidden');

var selectGrid = (x, y) => $(getGridID(x, y)).parent().addClass("selected-grid");

var unselectGrid = (x, y) => $(getGridID(x, y)).parent().removeClass("selected-grid");

const GRID_SPECIAL_VALUE = {
    UNSET: 0,
    FAIL: -1,
    SUCCESS: -2
 };
 Object.freeze(GRID_SPECIAL_VALUE)

navigator.sayswho = (function () {
    var ua = navigator.userAgent;
    var tem;
    var M =
        ua.match(
            /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
        ) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return "IE " + (tem[1] || "");
    }
    if (M[1] === "Chrome") {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(" ").replace("OPR", "Opera");
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join("_");
})();

var genDeviceID = () => {
    let numTab = parseInt(localStorage.numTab);
    numTab = isNaN(numTab) ? 1 : numTab + 1;

    localStorage.numTab = numTab;
    sessionStorage.tabID = numTab;

    return `${navigator.sayswho}_${numTab}`;
};

var getDeviceID = () => isNaN(parseInt(sessionStorage.tabID))
        ? genDeviceID()
        : `${navigator.sayswho}_${parseInt(sessionStorage.tabID)}`;

var randomInt = (l, r) => Math.floor(Math.random() * (r + 1 - l) + l)

var deepCopy = (arr) => JSON.parse(JSON.stringify(arr))