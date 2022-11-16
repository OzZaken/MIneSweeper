'use strict'

// todo: onMarkCell
// todo: onHint
// todo: SaveToLocalStorage
// todo: Add a Safe-Click Button:
// Clicking the Safe-Click button will mark a random covered cell
// (for a few seconds) that is safe to click (does not contain a MINE).
// Present the remaining Safe-Clicks count
// todo: Manually positioned mines
// Create a “manually create” mode in which user first positions
// the mines (by clicking cells) and then plays.
// todo:  Undo
// Add an “UNDO” button, each click on that button takes the
// game back by one step (can go all the way back to game start).
// todo:  7 BOOM!
// Add an “7 BOOM!” button, clicking the button restarts the
// game and locate the MINES according to the “7 BOOM”
// principles (each cell-index that contains “7” or a multiplication
// of “7”). Note that the cell-index shall be a continuous number
// (i.e. in a 8*8 Matrix is shall be between 0 to 63).
const MINE = '💣'
const FLAG = '🚩'
const LIVE = '❤️'
const HINT = '💡'
const GAMER_FACE = {
    lose: '🤯',
    sad: '😢',
    normal: '😐',
    nervous: '😯',
    happy: '😊',
    win: '😎',
}
const gGame = {
    hintLeft: 3,
    liveLeft: 3,
    shownCount: 0,
    markedCount: 0,
    isFirstClick: true,
    isOn: false,
    isAskHint: false,
    isMarking: false,
    gamerFace: null,
    startTime: null,
    timerInterVal: null,
    currLvl: 'beginner',
    levels: {
        beginner: {
            size: 4,
            mines: 2
        },
        medium: {
            size: 8,
            mines: 12
        },
        expert: {
            size: 12,
            mines: 30
        },

    },
    minesCells: [],
}
let gBoard
let gIsMouseDown

// Initialize
function initGame(lvlKey) {
    console.clear()
    
    // Model:
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.isOn = true
    gGame.isFirstClick = true
    gGame.isMarking = false
    gGame.isAskHint = false
    gGame.gamerFace = null
    gGame.startTime = null
    gGame.timerInterVal = null
    gGame.minesCells = []
    gIsMouseDown = false

    // Board & CurrLvl
    gGame.currLvl = gGame.levels[lvlKey] || gGame.currLvl
    const { size, mines } = gGame.currLvl
    const minesCount = mines - 1 // saved For after first Click
    gBoard = buildBoard(size, minesCount)

    // Face
    const elFace = document.querySelector('.face')
    elFace.classList.remove('clicked')
    setGamerFace(GAMER_FACE.happy)
    setTimeout(setGamerFace, 1000, GAMER_FACE.normal)

    // Live
    gGame.liveLeft = 3
    const elLive = document.querySelector('.live')
    renderEl(elLive, LIVE.repeat(gGame.liveLeft))

    // Hint
    gGame.hintLeft = 3
    const elHint = document.querySelector('.hint')
    renderEl(elHint, HINT.repeat(gGame.hintLeft))

    // Score
    gGame.score = 0
    const elScore = document.querySelector('.score')
    renderEl(elScore, '000')

    renderBoard()
    timerReset()
    console.log('initGame:', gGame)
}

// Modal:
function buildBoard(lvlSize, minesCount) {
    let board = []
    for (let i = 0; i < lvlSize; i++) {
        board[i] = []
        for (let j = 0; j < lvlSize; j++) { //? lvlSize[0]
            //  Set Mine Random 10% each cell is mine On First Loop
            let isMine // 0.10 * totalMines * totalCells 
            if (minesCount >= 1 && Math.random() <= 0.10) {
                isMine = true
                gGame.minesCells.push({ i, j })
                minesCount--
            }
            // Create cell
            board[i][j] = {
                pos: { i, j },
                isShown: false,
                isMine: isMine || false,
                isMarked: false,
                minesCount: 0,
            }
        }
    }
    // If Not All Mines On Board
    setRandomMines(board, minesCount)
    return board
}

function setGamerFace(gamerFace) {
    gGame.gamerFace = gamerFace
    const elFace = document.querySelector('.face')
    elFace.innerText = gGame.gamerFace
}

function setRandomMines(board = gBoard, count) { // Recursive Funcs
    if (count <= 0) return
    const randPosI = getRandomInt(0, board.length)
    const randPosJ = getRandomInt(0, board[0].length)
    const randCell = board[randPosI][randPosJ]
    if (!randCell.isMine) {
        randCell.isMine = true
        gGame.minesCells.push(randCell.pos)
        count--
    }
    setRandomMines(board, count)
}

function setBoardNeigsCount() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].minesCount = getCellNeigsCount(i, j)
        }
    }
}

function getCellNeigsCount(cellPosI, cellPosJ) {
    let neighborsCount = 0
    for (let i = cellPosI - 1; i <= cellPosI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (let j = cellPosJ - 1; j <= cellPosJ + 1; j++) {
            if (i === cellPosI && j === cellPosJ) continue
            if (j < 0 || j >= gBoard[i].length) continue
            if (gBoard[i][j].isMine) neighborsCount++
        }
    }
    return neighborsCount
}

function getDomModalCell(pos) {
    if (!pos) {
        const elCell = event.target
        const { i, j } = elCell.dataset
        const cell = gBoard[i][j]
        return { elCell, cell }
    }
    console.log('finding Cell By Pos:', pos)
    const { i, j } = pos
    const cell = gBoard[i][j]
    const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    return { elCell, cell }
}

// Dom:
function renderBoard(board = gBoard) {
    let strHtml = ''
    for (let i = 0; i < board.length; i++) {
        strHtml += '<tr>\n'
        for (let j = 0; j < board[0].length; j++) {
            // Data:
            const className = `class="cell cell-${i}-${j}"`
            const cellData = `data-i="${i}" data-j="${j}" data-minesCount="${board[i][j].minesCount}"`
            // Events:
            const onMarkCell = `oncontextmenu="onMarkCell()"`
            const onMouseDownCell = `onmousedown="onMouseDownCell()"`
            const onMouseOutElCell = `onmouseOut="onMouseOutCell(${i},${j})"`
            const onMouseOverElCell = `onmouseOver="onMouseOverCell()"`
            // Click: Two Event for Same Function
            const onClickCell = `onmouseUp="onClickCell()" onCLick="onClickCell()"`
            // InnerText
            const innerText = board[i][j].isMine ? MINE : board[i][j].minesCount
            const isShown = board[i][j].isShown ? innerText : ''
            strHtml += `\t<td ${onClickCell} ${className} ${cellData} ${onMouseOverElCell} ${onMarkCell} ${onMouseDownCell}  ${onMouseOutElCell}>${isShown && innerText}</td>\n`
        }
        strHtml += '</tr>\n'
    }
    document.querySelector('.game-board').innerHTML = strHtml
}

function renderEl(el, innerText) {
    el.innerText = innerText
}

// Cell Clicked
function cellClicked(pos) {
    const { elCell, cell } = pos ? getDomModalCell(pos) : getDomModalCell()
    // First Click
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false
        timerStart()
        // Last Mine On Board
        setRandomMines(gBoard, 1)
        setBoardNeigsCount()
    }

    if (gGame.isMarking) {
        console.log('gGame.isMarking:', gGame.isMarking)
        markCell(elCell, cell)
        return
    }

    // isShown
    if (cell.isShown) return
    cell.isShown = true

    // Hint
    if (gGame.isAskHint) {
        gGame.isAskHint = false
        // Todo
        return
    }

    // Cell Value
    const innerText = cell.isMine ? MINE : cell.minesCount ? cell.minesCount : ''
    renderEl(elCell, innerText)

    // Click On 3 options
    if (cell.isMine) clickOnMine(elCell, cell)
    else if (!cell.minesCount) {
        console.log('cell.minesCount:', cell.minesCount)
        expandShown(cell)
    }
    else setGamerFace(GAMER_FACE.happy)


    // Past All Options 
    gGame.shownCount++
    elCell.classList.add('clicked')
    console.log('gGame:', gGame)
    // Score
    const scoreToDisplay = gGame.shownCount.toString().padStart(3, '0')
    const elScore = document.querySelector('.score')
    renderEl(elScore, scoreToDisplay)
    // Win
    const totalCells = gGame.currLvl.size ** 2
    if (gGame.markedCount + gGame.shownCount === totalCells) win()
}
function win() {
    console.log('WIN');
}
function clickOnMine(elCell) {
    //    Live
    gGame.liveLeft = gGame.liveLeft - 1
    const elLive = document.querySelector('.live')
    renderEl(elLive, LIVE.repeat(gGame.liveLeft)) //? Readable? --gGame.liveLeft
    // Face
    setGamerFace(GAMER_FACE.sad)
    setTimeout(renderEl, 600, elCell, '💥')
    // Lose
    if (gGame.liveLeft <= 0) {
        gGame.isOn = false
        setTimeout(setGamerFace, 2000, GAMER_FACE.lose)
        timerStop()
        // Show all Mines
        gGame.minesCells.forEach(mineCell => {
            mineCell.isShown = true
            const { i, j } = mineCell
            getDomModalCell({ i, j }).elCell.innerText = MINE
        })
        return
    }
}

function expandShown(cell) {
    if (cell.minesCount) return
    const { i, j } = cell.pos
    let idxI = i
    let idxJ = j
    for (let i = idxI - 1; i <= idxI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue // I Out of Border  
        for (let j = idxJ - 1; j <= idxJ + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue // J Out of Border
            if (i === idxI && j === idxJ) continue // {i,j} Cell === currCell
            const currCell = gBoard[i][j]
            if (currCell.isMarked || currCell.isShown) continue //  isSown || Mark 
            if (!currCell.minesCount) cellClicked({ i, j })
        }
    }
}

// Face
function onMouseDownFace() {
    document.querySelector('.face').classList.add('clicked')
}

function onMouseUpFace() {
    document.querySelector('.face').classList.remove('clicked')
}

// Cell Events
function onMouseDownCell() {
    if (!gGame.isOn) return
    // Model
    gIsMouseDown = true
    //  Dom
    const elFace = document.querySelector('.face')
    renderEl(elFace, GAMER_FACE.nervous)
    const elCell = event.target
    elCell.classList.add('clicked')
}

function onMouseOverCell() {
    if (!gIsMouseDown) return
    event.target.classList.add('clicked')
}

function onClickCell() { // onclick & onmouseUp
    if (!gGame.isOn) return
    const { cell } = getDomModalCell()
    if (cell.isMarked) return
    gIsMouseDown = false
    cellClicked()
}

function onMouseOutCell(i, j) {
    if (!gIsMouseDown || gBoard[i][j].isShown) return
    event.target.classList.remove('clicked')
}

// Mark Cell
function onMarkCell() {
    event.preventDefault()
    console.log('onMarkCell:',)
    const { cell } = getDomModalCell()
    if (cell.isShown) return
    gGame.isMarking = true
}
function markCell(elCell, cell) {
    if (!cell.isMarked) {
        renderEl(elCell, FLAG)
        gGame.markedCount = gGame.markedCount++
    } else {
        gGame.markedCount = gGame.markedCount--
        renderEl(elCell, '')
    }
    cell.isMarked = !cell.isMarked
}

// Board
function onMouseLeaveBoard() {
    gIsMouseDown = false
    setGamerFace(GAMER_FACE.normal)
}

//  Btns
function onHint() {
    gGame.isAskHint = true
}