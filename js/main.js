'use strict'

function onSafeClick() {
    if (gGame.safeClickCount === 0 || gGame.isFirstClick) return

    const randEmptyCell = getRandEmptyCell()
    const { i, j } = randEmptyCell.pos
    const elRandCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    // Dom Effects
    elRandCell.style.backgroundColor = _getRandomColor()
    const setColorInterval = setInterval(() => {
        elRandCell.style.backgroundColor = _getRandomColor()
    }, 300)
    setTimeout(() => {
        clearInterval(setColorInterval)
        elRandCell.style.backgroundColor = 'darkgray'
        elRandCell.addEventListener('click', () => {
            elRandCell.style.backgroundColor = 'lightslategray'
        })
    }, 1500)
}
function getRandEmptyCell() {
    const emptyCells = !gGame.emptyCells || !gGame.emptyCells.length
        ? getEmptyCells() : gGame.emptyCells
    console.log('emptyCells:', emptyCells)
    const randCell = emptyCells[_getRandomInt(0, emptyCells.length)]
    return randCell
}

function getEmptyCells() {
    const { emptyCells } = gGame
    console.log('getEmptyCells():')
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            if (!gBoard[i][j].isMine) emptyCells.push(gBoard[i][j])
        }
    }
    return emptyCells
}

const GAMER_FACE = {
    lose: '🤯',
    sad: '😢',
    normal: '😐',
    nervous: '😯',
    happy: '😊',
    win: '😎',
}

const gGame = {
    isOn: false,
    isFirstClick: true,
    isAskHint: false,
    isMarking: false,
    face: null,
    startTime: null,
    timerInterVal: null,
    audio: null,
    hintCount: 3,
    safeClickCount: 3,
    liveCount: 3,
    shownCount: 0,
    markedCount: 0,
    mineCells: [],
    emptyCells: [],
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
    gameElements: {
        mine: '💣',
        flag: '🚩',
        live: '❤️',
        hint: '💡',
        face: {
            lose: '🤯',
            sad: '😢',
            normal: '😐',
            nervous: '😯',
            happy: '😊',
            win: '😎',
        },
    },
}

let gBoard
let gIsMouseDown

// Initialize
function initGame(lvlKey) {
    console.clear()
    const { live, hint } = gGame.gameElements
    // Model:
    gGame.isOn = true
    gGame.isFirstClick = true
    gIsMouseDown = false

    // CurrLvl
    const {levels} = gGame
    gGame.currLvl = levels[lvlKey] || gGame.currLvl
    const { size, mines } = gGame.currLvl

    // Mines
    const minesCount = mines - 1 // saved For after first Click
    gGame.mineCells = []

    // Board 
    gBoard = buildBoard(size, minesCount)
    renderBoard()

    // Mark
    gGame.isMarking = false
    gGame.markedCount = 0

    // Face
    const elFace = document.querySelector('.face')
    elFace.classList.remove('clicked')
    setFace(GAMER_FACE.win)
    setTimeout(setFace, 1500, GAMER_FACE.happy)
    setTimeout(setFace, 2500, GAMER_FACE.normal)

    // Live
    gGame.liveCount = 3
    const elLive = document.querySelector('.live')
    renderEl(elLive, live.repeat(gGame.liveCount))

    // Hint
    gGame.isAskHint = false
    gGame.hintCount = 3
    const elHint = document.querySelector('.hint')
    renderEl(elHint, hint.repeat(gGame.hintCount))

    // Score
    gGame.shownCount = 0
    gGame.score = 0
    const elScore = document.querySelector('.score')
    renderEl(elScore, '000')

    // Timer
    timerReset()
}

// Build Board & Set Mine Random (
function buildBoard(lvlSize, minesCount) {
    let board = []
    for (let i = 0; i < lvlSize; i++) {
        board[i] = []
        for (let j = 0; j < lvlSize; j++) {
            // 10% foreach cell is mine On First Loop)
            let isMine
            if (minesCount >= 1 && Math.random() <= 0.10) {
                isMine = true
                gGame.mineCells.push({ i, j })
                minesCount--
            }

            // Create cell
            board[i][j] = {
                id: _makeId(),
                pos: { i, j },
                isShown: false,
                isMine: isMine || false,
                isMarked: false,
                minesCount: 0,
            }
        }
    }
    // If Not All Mines On Board ( 0.10 * totalMines * totalCells). 
    setRandomMines(board, minesCount)
    return board
}

// Set random Cell Recursive 
function setRandomMines(board = gBoard, count) {
    if (count <= 0) return
    const randPosI = _getRandomInt(0, board.length)
    const randPosJ = _getRandomInt(0, board[0].length)
    const randCell = board[randPosI][randPosJ]
    if (!randCell.isMine) {
        randCell.isMine = true
        gGame.mineCells.push(randCell.pos)
        count--
    }
    setRandomMines(board, count)
}

// Set each Cell minesCount & 
function setBoardNeigsCount() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            gBoard[i][j].minesCount = getCellNeigsCount(i, j)
            const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
            elCell.dataset.minescount = gBoard[i][j].minesCount
        }
    }
}

// return num Cell mines
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

// return relevant {elCell,cell}
function getDomModalCell(pos) {
    if (!pos) {
        const elCell = event.target
        const { i, j } = elCell.dataset
        const cell = gBoard[i][j]
        return { elCell, cell }
    }
    const { i, j } = pos
    const cell = gBoard[i][j]
    const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    return { elCell, cell }
}

// Set Cells data & mouseEvents attributes each cell based model:
function renderBoard(board = gBoard) {
    const { mine } = gGame.gameElements
    let strHtml = ''
    for (let i = 0; i < board.length; i++) {
        strHtml += '\t<tr>\n'
        for (let j = 0; j < board[0].length; j++) {
            // Data:
            const className = `class="cell"`
            const cellData = `data-i="${i}" data-j="${j}" data-minesCount="${board[i][j].minesCount}"`
            // Events:
            const onMarkCell = `oncontextmenu="onMarkCell()"`
            const onMouseDownCell = `onmousedown="onMouseDownCell()"`
            const onMouseOutElCell = `onmouseOut="onMouseOutCell(${i},${j})"`
            const onMouseOverElCell = `onmouseOver="onMouseOverCell()"`
            const onClickCell = `onCLick="onClickCell()"`
            // InnerText
            const innerText = board[i][j].isMine ? mine : board[i][j].minesCount
            const isShown = board[i][j].isShown ? innerText : ''
            strHtml += `\t<td  ${onClickCell} ${className} ${cellData} ${onMouseOverElCell} ${onMarkCell} ${onMouseDownCell}  ${onMouseOutElCell}>${isShown && innerText}</td>\n`
        }
        strHtml += '\t</tr>\n'
    }
    document.querySelector('.game-board').innerHTML = strHtml
}


//* Coordinate Cell Clicked based Event  
function clickedCell(pos) {
    // return when ask Hint before First Click
    if (gGame.isFirstClick && gGame.isAskHint) {
        console.log('TODO: UserMsg Cant use Hint on First Click')
        return
    }

    // First Click
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false
        timerStart()
        // Set Last Mine On Board
        setRandomMines(gBoard, 1)
        setBoardNeigsCount()
        getEmptyCells()
    }

    const { elCell, cell } = pos ? getDomModalCell(pos) : getDomModalCell()

    // Mark Cell
    if (gGame.isMarking) {
        console.log('elCell:', elCell)
        console.log('elCell:', cell)
        markCell(elCell, cell)
        return
    }

    // Hint
    if (gGame.isAskHint) {
        const { hint } = gGame.gameElements
        gGame.isAskHint = false
        gGame.hintCount--
        document.querySelector('.hint').innerText = hint.repeat(gGame.hintCount)
        // reveal Cell and his neighbors for 1 sec. 
        const { i, j } = cell.pos
        let cellPosI = i
        let cellPosJ = j
        for (let i = cellPosI - 1; i <= cellPosI + 1; i++) {
            if (i < 0 || i >= gBoard.length) continue
            for (let j = cellPosJ - 1; j <= cellPosJ + 1; j++) {
                if (j < 0 || j >= gBoard[i].length) continue
                const elCellNeighbor = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                elCellNeighbor.classList.add('clicked')
                const minesCount = gBoard[i][j].minesCount ? gBoard[i][j].minesCount : ''
                renderEl(elCellNeighbor, minesCount)
                setTimeout(() => {
                    if (!gBoard[i][j].isShown) {
                        elCellNeighbor.classList.remove('clicked')
                        renderEl(elCellNeighbor, '')
                    }
                }, 1000)
            }
        }
        return
    }

    // isShown
    if (cell.isShown) return
    cell.isShown = true

    // Cell Value
    const { mine } = gGame.gameElements
    const innerText = cell.isMine ? mine : cell.minesCount ? cell.minesCount : ''
    renderEl(elCell, innerText)

    // 3 Options Clicks
    if (cell.isMine) clickOnMine(elCell, cell)
    else if (!cell.minesCount) expandShown(cell)
    else setFace(GAMER_FACE.happy)

    // Past All Options 
    gGame.shownCount++
    elCell.classList.add('clicked')
    const { emptyCells } = gGame
    const cellIdx = emptyCells.findIndex(currCell => currCell.id === cell.id)
    emptyCells.splice(cellIdx)

    // Score
    const scoreToDisplay = gGame.shownCount.toString().padStart(3, '0')
    const elScore = document.querySelector('.score')
    renderEl(elScore, scoreToDisplay)

    // Win
    // gGame.mineCells.every((mineCell) => mineCell.isShown || mineCell.isMarked)
    const totalCells = gGame.currLvl.size ** 2
    if (gGame.markedCount + gGame.shownCount === totalCells) win()
}

// Loop throw cell neighbors for clickedCell
function expandShown(cell) {
    if (cell.minesCount) return
    const { i, j } = cell.pos
    let idxI = i
    let idxJ = j
    for (let i = idxI - 1; i <= idxI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue // I Out of Border  
        for (let j = idxJ - 1; j <= idxJ + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue // J Out of Border
            if (i === idxI && j === idxJ) continue // Cell === CurrCell
            const currCell = gBoard[i][j]
            if (currCell.isMarked || currCell.isShown) continue //  is already Shown || Mark 
            if (!currCell.minesCount) clickedCell({ i, j })
        }
    }
}

// Add Score to local storage.
function win() {
    timerStop()
    setTimeout(setFace, 2000, GAMER_FACE.win)
}

// Handle mine clicking & check Game Over
function clickOnMine(elCell) {
    // Live
    const { mine, live } = gGame.gameElements

    gGame.liveCount = gGame.liveCount - 1
    const elLive = document.querySelector('.live')
    renderEl(elLive, live.repeat(gGame.liveCount)) //? Readable? --gGame.liveLeft
    // Face
    setFace(GAMER_FACE.sad)
    setTimeout(renderEl, 600, elCell, '💥')
    // Lose
    if (gGame.liveCount <= 0) {
        gGame.isOn = false
        setTimeout(setFace, 2000, GAMER_FACE.lose)
        timerStop()
        // Reveal all mines with time effect
        gGame.mineCells.forEach((mineCell, idx) => {
            mineCell.isShown = true
            const { i, j } = mineCell
            setTimeout(() => {
                if (gGame.isOn) return
                getDomModalCell({ i, j }).elCell.innerText = mine
            }, idx * 300)
        })
    }
}

// Set gIsMouseDown and Dom reaction
function onMouseDownCell() {
    if (!gGame.isOn) return
    // Model
    gIsMouseDown = true
    //  Dom
    setFace(GAMER_FACE.nervous)
    const elCell = event.target
    elCell.classList.add('clicked')
}

// Set gIsMouseDown and send clickedCell()
function onClickCell() {
    if (!gGame.isOn) return
    const { cell } = getDomModalCell()
    if (cell.isMarked) return
    gIsMouseDown = false
    clickedCell()
}

// Cancel contextmenu & set gGame.isMarking = true   
function onMarkCell() {
    event.preventDefault()
    gGame.isMarking = true
    const { elCell, cell } = getDomModalCell()
    if (cell.isShown) return
    if (event.target.classList.contains('cell')) markCell(elCell, cell)
}

// Mark/Unmark cell  
function markCell(elCell, cell) {
    const { flag } = gGame.gameElements
    const { currLvl } = gGame
    if (gGame.markedCount === currLvl.mines && !cell.isMarked) return
    if (!cell.isMarked) {
        renderEl(elCell, flag)
        gGame.markedCount++
    } else {
        gGame.markedCount--
        renderEl(elCell, '')
    }
    cell.isMarked = !cell.isMarked
    gGame.isMarking = false
}

// Add class "clicked" if MouseDown 
function onMouseOverCell() {
    if (!gIsMouseDown) return
    event.target.classList.add('clicked')
}

// Remove class "clicked" if Cell !isShown
function onMouseOutCell(i, j) {
    if (!gIsMouseDown || gBoard[i][j].isShown) return
    event.target.classList.remove('clicked')
}

// Cancel isMouseDown
function onMouseLeaveBoard() {
    if (!gGame.isOn) return
    gIsMouseDown = false
    setFace(GAMER_FACE.normal)
}

// Set isAskHint
function onAskHint() {
    if (gGame.shownCount <= 0) return
    gGame.isAskHint = true
}

//*                                      Timer  
//  Set startTime & setInterval
function timerStart() {
    gGame.startTime = Date.now()
    gGame.timerInterVal = setInterval(renderTime, 1111, gGame.startTime)
}
//  Set timePast & render to Dom
function renderTime(startTime) {
    if (!gGame.isOn) return
    const timePast = Date.now() - startTime
    document.querySelector('.timer').innerText = _getDateForDisplay(timePast)
}
// clear render interval 
function timerStop() {
    clearInterval(gGame.timerInterVal)
    gGame.timerInterVal = null
}
// set starting time 
function timerReset() {
    gGame.startTime = null
    timerStop()
    document.querySelector('.timer').innerText = '00:00'
}

//*                                        Face
//  Set Face Model and Dom
function setFace(gamerFace) {
    gGame.face = gamerFace
    const elFace = document.querySelector('.face')
    elFace.innerText = gGame.face
}

// Add/Remove "clicked" from ElFace onMouseDown onMouseUpFace based isShown
function onMouseDownFace() {
    document.querySelector('.face').classList.add('clicked')
}
function onMouseUpFace() {
    document.querySelector('.face').classList.remove('clicked')
}