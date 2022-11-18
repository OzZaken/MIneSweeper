'use strict'

const gGame = {
    isOn: false,
    isFirstClick: true, // First click
    isMarking: false, // Mark
    face: null, // Face
    startTime: null, // Time
    timeInterVal: null, // Time
    audio: null, // Sound Effects
    isAskHint: false, // Hint
    hintCount: 3, // Hint
    safeClickCount: 3, // Safe-click
    lifeCount: 3, // Life
    shownCount: 0, // Score
    markedCount: 0, // Score
    board: [], // Board
    moveStates: [], // Undo
    mineCells: [], // Mines cells
    emptyCells: [], // empty cells
    topScore: {}, // localStorage
    gameElements: { //  game elements
        mine: '💣',
        flag: '🚩',
        life: '❤️',
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
    currLvl: 'beginner',
}
const gDomEls = {
    elBoard: null,
    elFace: null,
    elLife: null,
    elScore: null,
    elTopScore: null,
    elTime: null,
    elHint: null,
    elUserMsg: null,
}
let gIsMouseDown

    //An IIFE Call the Constant Dom Elements one only time at loading page. 
    ; (() => {
        gDomEls.elFace = document.querySelector('.face')
        gDomEls.elBoard = document.querySelector('.board')
        gDomEls.elLife = document.querySelector('.life')
        gDomEls.elScore = document.querySelector('.score')
        gDomEls.elTopScore = document.querySelector('.top-score')
        gDomEls.elHint = document.querySelector('.hint')
        gDomEls.elTime = document.querySelector('.time')
        gDomEls.elUserMsg = document.querySelector('.user-msg')
    })()

// Initialize Game
function initGame(lvlKey) {
    gGame.isOn = true
    gGame.isFirstClick = true
    gIsMouseDown = false
    gGame.board = null

    // CurrLvl
    const { levels } = gGame
    gGame.currLvl = Object.keys(levels).find(strLvl => strLvl === lvlKey) || gGame.currLvl

    // Cells
    gGame.mineCells = []
    gGame.emptyCells = []

    // Board 
    const { size } = levels[gGame.currLvl]
    gGame.board = buildBoard(size)
    renderBoard()

    // Mark
    gGame.isMarking = false
    gGame.markedCount = 0

    const { life, hint, face } = gGame.gameElements
    const { elLife: ellife, elHint, elFace, elScore, elTopScore } = gDomEls

    // Face
    elFace.classList.remove('clicked')
    setFace(face.win)
    setTimeout(setFace, 1500, face.happy)
    setTimeout(setFace, 2500, face.normal)

    // life
    gGame.lifeCount = 3
    if (gGame.currLvl === 'beginner') gGame.lifeCount--
    elLife.innerText = life.repeat(gGame.lifeCount)

    // Hint
    gGame.isAskHint = false
    gGame.hintCount = 3
    elHint.innerText = hint.repeat(gGame.hintCount)

    // Score
    gGame.shownCount = 0
    elScore.innerText = '000'
    gGame.topScore = _loadFromStorage('main-sweeper') || {}
    if (gGame.topScore[gGame.currLvl]) {
        const currLvlTopScore = gGame.topScore[gGame.currLvl].split('|')
        const TopScoreToDisplay = `best score at ${gGame.currLvl}\n` +
            `<span class="score">${currLvlTopScore[0].padStart(3, '0')}</span>\nIn <span class="score">${currLvlTopScore[1]}</span> seconde!`
        elTopScore.innerHTML = TopScoreToDisplay
    }

    // Time
    timeReset()

    // Undo
    gGame.moveStates = []
}

// Set random Cell Recursive 
function setRandomMines(count) {
    if (count <= 0) return
    const { board } = gGame
    const randPosI = _getRandomInt(0, board.length)
    const randPosJ = _getRandomInt(0, board[0].length)
    const randCell = board[randPosI][randPosJ]
    if (!randCell.isMine && !randCell.isShown) {
        randCell.isMine = true
        gGame.mineCells.push(randCell.pos)
        count--
    }
    setRandomMines(count)
}

// return relevant {elCell, cell}
function getDomModalCell(pos) {
    if (!pos) {
        const elCell = event.target
        const { i, j } = elCell.dataset
        const cell = gGame.board[i][j]
        return { elCell, cell }
    }
    const { i, j } = pos
    const cell = gGame.board[i][j]
    const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    return { elCell, cell }
}

// Build Board & Set Mine Random  //*                  Board
function buildBoard(lvlSize) {
    let board = []
    for (let i = 0; i < lvlSize; i++) {
        board[i] = []
        for (let j = 0; j < lvlSize; j++) {
            // Create cell
            board[i][j] = {
                pos: { i, j },
                isShown: false,
                isMine: false,
                isMarked: false,
                minesCount: 0,
            }
        }
    }
    return board
}

// Set Cells data & mouseEvents based model. 
function renderBoard(board = gGame.board) {
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
            const value = board[i][j].isMine ? mine : board[i][j].minesCount ? board[i][j].minesCount : ''
            strHtml += `\t<td  ${onClickCell} ${className} ${cellData} ${onMouseOverElCell} ${onMarkCell} ${onMouseDownCell}  ${onMouseOutElCell}>${value}</td>\n`
        }
        strHtml += '\t</tr>\n'
    }
    document.querySelector('.board').innerHTML = strHtml
}

// Cancel isMouseDown & set face
function onMouseLeaveBoard() {
    if (!gGame.isOn) return
    gIsMouseDown = false
    const { face } = gGame.gameElements
    setFace(face.normal)
}

// Set each Cell minesCount  //*                        Cell  
function setCellsNeigsCount() {
    for (let i = 0; i < gGame.board.length; i++) {
        for (let j = 0; j < gGame.board[0].length; j++) {
            gGame.board[i][j].minesCount = getCellNeigsCount(i, j)
            const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
            elCell.dataset.minescount = gGame.board[i][j].minesCount // 🐛
        }
    }
}

// return Cell minesCount 
function getCellNeigsCount(cellPosI, cellPosJ) {
    let neighborsCount = 0
    for (let i = cellPosI - 1; i <= cellPosI + 1; i++) {
        if (i < 0 || i >= gGame.board.length) continue
        for (let j = cellPosJ - 1; j <= cellPosJ + 1; j++) {
            if (i === cellPosI && j === cellPosJ) continue
            if (j < 0 || j >= gGame.board[i].length) continue
            if (gGame.board[i][j].isMine) neighborsCount++
        }
    }
    return neighborsCount
}

// Coordinate Cell Clicked based Event       
function clickedCell(pos) {
    if (gGame.isFirstClick && gGame.isAskHint) return
    const { elCell, cell } = pos ? getDomModalCell(pos) : getDomModalCell()

    // First Click
    if (gGame.isFirstClick) {
        gGame.shownCount++
        cell.isShown = true
        const { levels, currLvl } = gGame
        const { mines } = levels[currLvl]
        setRandomMines(mines)
        gGame.isFirstClick = false
        timeStart()
        setCellsNeigsCount()
        setEmptyCells()
    }

    // Mark Cell
    if (gGame.isMarking) {
        console.log('elCell:', elCell)
        console.log('elCell:', cell)
        markCell(elCell, cell)
        return
    }

    // Hint
    if (gGame.isAskHint && gGame.hintCount > 0) {
        gGame.isAskHint = false
        gGame.hintCount--
        const { hint, mine } = gGame.gameElements
        const { elHint } = gDomEls
        elHint.innerText = hint.repeat(gGame.hintCount)
        // Reveal Cell and his neighbors for 1 sec. 
        const { i, j } = cell.pos
        let cellPosI = i
        let cellPosJ = j
        for (let i = cellPosI - 1; i <= cellPosI + 1; i++) {
            if (i < 0 || i >= gGame.board.length) continue
            for (let j = cellPosJ - 1; j <= cellPosJ + 1; j++) {
                if (j < 0 || j >= gGame.board[i].length) continue
                const currElCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                currElCell.classList.add('clicked')
                const elCellValue = cell.isMine ? mine :
                    gGame.board[i][j].minesCount ? gGame.board[i][j].minesCount : ''
                currElCell.innerText = elCellValue
                setTimeout(() => {
                    if (!gGame.board[i][j].isShown) {
                        currElCell.classList.remove('clicked')
                        currElCell.innerText = ''
                    }
                }, 1000)
            }
        }
        return
    }

    // isShown
    if (cell.isShown) return
    cell.isShown = true
    gGame.shownCount++
    elCell.classList.add('clicked')

    // Cell Value
    const { mine, face } = gGame.gameElements
    const innerText = cell.isMine ? mine : cell.minesCount ? cell.minesCount : ''
    elCell.innerText = innerText

    // 3 Options Clicks
    if (cell.isMine) clickOnMine(elCell, cell)
    else if (!cell.minesCount) expandShown(cell)
    else setFace(face.happy)

    // Remove cell tracking 
    const { i, j } = cell.pos
    const { emptyCells } = gGame
    const cellIdx = emptyCells.findIndex(emptyCell => emptyCell.pos.i === i && emptyCell.pos.j === j)
    emptyCells.splice(cellIdx, 1)

    // Score
    const { elScore } = gDomEls
    const scoreToDisplay = gGame.shownCount.toString().padStart(3, '0')
    elScore.innerText = scoreToDisplay

    // Win
    // gGame.mineCells.every((mineCell) => mineCell.isShown || mineCell.isMarked)
    const totalCells = gGame.levels[gGame.currLvl].size ** 2
    if (gGame.markedCount + gGame.shownCount === totalCells) win()
}

// Loop throw cell neighbors for clickedCell
function expandShown(cell) {
    if (cell.minesCount) return

    const { i, j } = cell.pos
    let idxI = i
    let idxJ = j
    for (let i = idxI - 1; i <= idxI + 1; i++) {
        if (i < 0 || i >= gGame.board.length) continue // I Out of Border  
        for (let j = idxJ - 1; j <= idxJ + 1; j++) {
            if (j < 0 || j >= gGame.board[0].length) continue // J Out of Border
            if (i === idxI && j === idxJ) continue // Cell === CurrCell
            const currCell = gGame.board[i][j]
            if (currCell.isMarked || currCell.isShown) continue //  is already Shown || Mark 
            if (!currCell.minesCount) clickedCell({ i, j })
        }
    }
}

// Handle mine clicking & check Game Over
function clickOnMine(elCell, cell) {
    // Life
    const { mine, life, face } = gGame.gameElements
    const { elLife: elLife } = gDomEls
    gGame.lifeCount = gGame.lifeCount - 1
    elLife.innerText = life.repeat(gGame.lifeCount)
    setTimeout(() => elCell.innerText = '💥', 600)

    // Remove this mine from mines Array 
    const { mineCells } = gGame
    const cellIdx = mineCells.findIndex(mineCell => mineCell === cell)
    console.log('cellIdx:', cellIdx)
    mineCells.splice(cellIdx, 1)
    // Lose
    if (gGame.lifeCount <= 0) {
        gGame.isOn = false
        setTimeout(setFace, 2000, face.lose)
        timeStop()
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
    // Face
    setFace(face.sad)
}

// Set gIsMouseDown and Dom reaction
function onMouseDownCell() {
    if (!gGame.isOn) return
    // Model
    const { face } = gGame.gameElements
    gIsMouseDown = true
    //  Dom
    setFace(face.nervous)
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

// Add class "clicked" if MouseDown 
function onMouseOverCell() {
    if (!gIsMouseDown) return
    event.target.classList.add('clicked')
}

// Remove class "clicked" if Cell !isShown
function onMouseOutCell(i, j) {
    if (!gIsMouseDown || gGame.board[i][j].isShown) return
    event.target.classList.remove('clicked')
}

// Cancel contextmenu & set isMarking  //*          Mark
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
        elCell.innerText = flag
        gGame.markedCount++
    } else {
        gGame.markedCount--
        elCell.innerText = ''
    }
    cell.isMarked = !cell.isMarked
    gGame.isMarking = false
}

// Set isAskHint //*                                Hint
function onAskHint() {
    if (gGame.shownCount <= 0 || gGame.isFirstClick) return
    gGame.isAskHint = true
    const { elUserMsg } = gDomEls

    elUserMsg.innerText = '💡'
    elUserMsg.style.display = 'flex'
    elUserMsg.style.animation = "show-hint 1.5s cubic-bezier(0, 0, 0.04, 0.99)"
    setTimeout(() => { elUserMsg.style.display = 'none' }, 1000)
    // Only on Dom
    const { hint } = gGame.gameElements
    const { elHint } = gDomEls
    elHint.innerText = hint.repeat(gGame.hintCount - 1)
}

function onMouseOverHint() {
    const { elHint } = gDomEls
    elHint.classList.add('hint-hover')
}

function onMouseOutHint() {
    const { elHint } = gDomEls
    elHint.classList.remove('hint-hover')
}
// reveal random empty cell for sec //*            Safe-Click
function onSafeClick() {
    if (gGame.safeClickCount === 0 || gGame.isFirstClick) return
    const randEmptyCell = getRandEmptyCell()
    const { i, j } = randEmptyCell.pos
    const elRandCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    // Dom Effects
    elRandCell.style.backgroundColor = _getRandomColor()
    const setColorInterval = setInterval(() => {
        elRandCell.style.backgroundColor = _getRandomColor()
    }, 200)
    setTimeout(() => {
        clearInterval(setColorInterval)
        elRandCell.style.backgroundColor = 'darkgray'
        elRandCell.addEventListener('click', () => elRandCell.style.backgroundColor = 'lightslategray')
    }, 1200)
}

// return random empty Cell from Array 
function getRandEmptyCell() {
    const emptyCells = !gGame.emptyCells || !gGame.emptyCells.length ?
        setEmptyCells() : gGame.emptyCells
    console.log('emptyCells:', emptyCells)
    const randCell = emptyCells[_getRandomInt(0, emptyCells.length)]
    return randCell
}

// Loop over Board adding emptyCell too Array
function setEmptyCells() {
    const { emptyCells } = gGame
    for (let i = 0; i < gGame.board.length; i++) {
        for (let j = 0; j < gGame.board[0].length; j++) {
            if (!gGame.board[i][j].isMine) emptyCells.push(gGame.board[i][j])
        }
    }
    return emptyCells
}

//  Set Face Model and Dom //*                          Face
function setFace(gamerFace) {
    gGame.face = gamerFace
    const { elFace } = gDomEls
    elFace.innerText = gGame.face
}

// Add/Remove "clicked" from to ElFace
function onMouseDownFace() {
    gDomEls.elFace.classList.add('clicked')
}

function onMouseUpFace() {
    gDomEls.elFace.classList.remove('clicked')
}

//  Set startTime & setInterval //*                    Time
function timeStart() {
    gGame.startTime = Date.now()
    gGame.timeInterVal = setInterval(renderTime, 1000, gGame.startTime)
}

//  Set timePast & render to Dom
function renderTime(startTime) {
    if (!gGame.isOn) return
    const timePast = Date.now() - startTime
    const { elTime } = gDomEls
    elTime.innerText = _getDateForDisplay(timePast)
}

// clear render interval 
function timeStop() {
    clearInterval(gGame.timeInterVal)
    gGame.timeInterVal = null
}

// set starting time 
function timeReset() {
    gGame.startTime = null
    timeStop()
    const { elTime } = gDomEls
    elTime.innerText = '00:00'
}

// Add Score to local storage. //*                   Score
function win() {
    console.log('win:', gGame)

    timeStop()
    const { currLvl, hintCount, LifeCount, safeClickCount, shownCount, startTime } = gGame
    const score = hintCount + LifeCount + safeClickCount + shownCount

    console.log('score:', score)
    console.log('Game.topScore:', gGame.topScore)
    const timePast = Date.now() - startTime
    gGame.topScore[currLvl] = `${score} | ${_getDateForDisplay(timePast)}`
    _saveToStorage('main-sweeper', gGame.topScore)

    const { elScore } = gDomEls
    let scoreToDisplay = shownCount
    const raiseScoreInterval = setInterval(() => {
        if (scoreToDisplay === gGame.topScore[currLvl]) clearInterval(raiseScoreInterval)
        scoreToDisplay++
        elScore.innerText === scoreToDisplay
    }, 1000)

    const { face } = gGame.gameElements
    setTimeout(setFace, 2000, face.win)
}