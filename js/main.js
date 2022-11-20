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
    lvls: {
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
        pro: {
            size: 12,
            mines: 40
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

    // An IIFE Call the Constant Dom Elements at loading page. 
    ; (() => {
        gDomEls.elFace = document.querySelector('.face')
        gDomEls.elBoard = document.querySelector('.board')
        gDomEls.elLife = document.querySelector('.life')
        gDomEls.elScore = document.querySelector('.score')
        gDomEls.elTopScore = document.querySelector('.top-score')
        gDomEls.elHint = document.querySelector('.hint')
        gDomEls.elTime = document.querySelector('.time')
        gDomEls.elUserMsg = document.querySelector('.user-msg')
        // the Diff between
        gDomEls.btnsLvlContainer = document.querySelector('.btns-lvl')
        // Can get after rendering
        setTimeout(() => {

        }, 300)
    })()

// Initialize Game
function initGame(lvlKey) {
    console.clear()
    gGame.isOn = true
    gGame.isFirstClick = true
    gIsMouseDown = false
    gGame.board = null

    // Lvl
    const { lvls: levels } = gGame
    gGame.currLvl = Object.keys(levels).find(strLvl => strLvl === lvlKey) || gGame.currLvl
    renderLvls()
    gDomEls.btnsLvl = [...document.querySelectorAll('.btn-lvl')]

    // Cells
    gGame.mineCells = []
    gGame.emptyCells = []

    // Board 
    const { size } = levels[gGame.currLvl]
    gGame.board = buildBoard(size)
    renderBoard()
    gDomEls.elCells = [...document.querySelectorAll('.cell')]

    // Mark
    gGame.isMarking = false
    gGame.markedCount = 0

    const { life, hint, face } = gGame.gameElements
    const { elLife, elHint, elFace, elScore, elTopScore } = gDomEls

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
        const TopScoreToDisplay = `best score at <b>${gGame.currLvl}<b>\n<br />` +
            `<span class="score">${currLvlTopScore[0].padStart(3, '0')}</span> <span class="score">⌛${currLvlTopScore[1]}</span>`
        elTopScore.innerHTML = TopScoreToDisplay
    }

    // Time
    timeReset()

    // Undo
    gGame.moveStates = []
}

//*                                                                             Board
// Build Board & Set Mine Random  
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
            const currCell = board[i][j]
            // Data:
            const className = `class="cell cell-${i}-${j}"`
            const cellData = `data-minesCount="${currCell.minesCount}" data-i="${i}" data-j="${j}"`
            const cellRole = 'role="button"'
            // Events:
            const onMouseOutCell = `onmouseOut="onMouseOutCell(${i},${j})"`
            const onMarkCell = `oncontextmenu="onMarkCell()"`
            const onMouseDownCell = `onmousedown="onMouseDownCell()"`
            const onMouseOverElCell = `onmouseOver="onMouseOverCell()"`
            const onClickCell = `onCLick="onClickCell()"`
            // InnerText
            const value = currCell.isMine && currCell.isShown ? mine : currCell.minesCount ? currCell.minesCount : ''
            strHtml += `\t<td ${cellRole} ${className} ${cellData} ${onMouseOutCell} ${onMarkCell} ${onMouseDownCell} ${onMouseOverElCell} ${onClickCell}>${value}</td>\n`
        }
        strHtml += '\t</tr>\n'
    }
    const { elBoard } = gDomEls
    elBoard.innerHTML = strHtml
}

// Set gIsMouseDown,face & Remove Cell Event Listeners.
function onMouseLeaveBoard() {
    if (!gGame.isOn) return
    gIsMouseDown = false
    const { face } = gGame.gameElements
    setFace(face.normal)
}

//*                                                                            Levels
function renderLvls() {
    const { lvls } = gGame
    const { btnsLvlContainer } = gDomEls
    let strHtml = ''

    let lvlsStr = Object.keys(lvls)
    for (let i = 0; i < lvlsStr.length; i++) {
        strHtml += `<button onclick="initGame(this.value)" value="${lvlsStr[i]}" class="btn btn-lvl active" role="button">${lvlsStr[i]}</button>\n`
    }

    btnsLvlContainer.innerHTML = strHtml
}

//*                                                                             Cell  
// Set each Cell minesCount 
function setCellsNeigsCount() {
    for (let i = 0; i < gGame.board.length; i++) {
        for (let j = 0; j < gGame.board[0].length; j++) {
            gGame.board[i][j].minesCount = getCellNeigsCount(i, j)
            const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
            elCell.dataset.minescount = gGame.board[i][j].minesCount // 🐛
        }
    }
}

// return relevant {elCell, cell}
function getDomModalCell(pos) {
    const { board } = gGame
    if (!pos) {
        const elCell = event.target
        const { i, j } = elCell.dataset
        const cell = board[i][j]
        return { elCell, cell }
    }
    const { i, j } = pos
    const cell = board[i][j]
    const elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    return { elCell, cell }
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
function CellClicked(pos) {
    console.log('gGame.lifeCount:', gGame.lifeCount)
    if (gGame.isFirstClick && gGame.isAskHint) return
    const { elCell, cell } = pos ? getDomModalCell(pos) : getDomModalCell()
    // First Click
    if (gGame.isFirstClick) {
        gGame.shownCount++
        cell.isShown = true
        const { lvls: levels, currLvl } = gGame
        const { mines } = levels[currLvl]
        setRandomMines(mines)
        gGame.isFirstClick = false
        timeStart()
        setCellsNeigsCount()
        setEmptyCells()
    }

    // Mark Cell
    if (gGame.isMarking) {
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
        const { board } = gGame
        const { i, j } = cell.pos
        let cellPosI = i
        let cellPosJ = j
        for (let i = cellPosI - 1; i <= cellPosI + 1; i++) {
            if (i < 0 || i >= board.length) continue
            for (let j = cellPosJ - 1; j <= cellPosJ + 1; j++) {
                if (j < 0 || j >= board[i].length) continue
                const currElCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
                currElCell.classList.add('clicked')
                const currCell = board[i][j]
                const elCellValue = currCell.isMine ? mine : currCell.minesCount ? currCell.minesCount : ''
                currElCell.innerText = elCellValue
                setTimeout(() => {
                    if (!currCell.isShown) {
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
    const totalCells = gGame.lvls[gGame.currLvl].size ** 2
    if (gGame.markedCount + gGame.shownCount === totalCells) win()
    savedToMovesState()
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
            if (!currCell.minesCount) CellClicked({ i, j })
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
    CellClicked()
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

//*                                                                    Mine 
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

//*                                                                    Mark
// Cancel contextmenu & set isMarking  
function onMarkCell() {
    const { isFirstClick } = gGame
    if (isFirstClick) return
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

//*                                                                    Hint
// Set isAskHint
function onAskHint() {
    if (!gGame.isOn) return
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

//*                                                                 Safe-Click
// reveal random empty cell for sec 
function onSafeClick() {
    if (!gGame.isOn) return
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

//*                                                                     Face
//  Set Face Model and Dom 
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

//*                                                                    Time
//  Set startTime & setInterval 
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

//*                                                                     Undo
function onUndo() {
    const { isFirstClick } = gGame
    if (isFirstClick) return
    console.log('gGame.moves:', gGame.moveStates)
    console.log('gGame.moves:', gGame.board)
}

function savedToMovesState() {
    const { board, moveStates } = gGame
    const newBoard = []
    for (let i = 0; i < board.length; i++) {
        newBoard[i] = []
        for (let j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            const newCell = {}
            for (const key in currCell) {
                newCell[key] = currCell[key]
            }
            newBoard[i][j] = newCell
        }
    }
    moveStates.push(newBoard)
}

//*                                                                    Score
// Add Score to local storage. 
function win() {
    timeStop()
    const { currLvl, hintCount, lifeCount, safeClickCount, shownCount, startTime,topScore } = gGame
    const score = hintCount + lifeCount + safeClickCount + shownCount

    const timePast = Date.now() - startTime
    topScore[currLvl] = `${score} | ${_getDateForDisplay(timePast)}`
    console.log('topScore:', topScore) // { beginner:value,}
    _saveToStorage('main-sweeper', topScore)

    const { elScore } = gDomEls
    let scoreToDisplay = shownCount
    const raiseScoreInterval = setInterval(() => {
        if (scoreToDisplay === topScore[currLvl]) clearInterval(raiseScoreInterval)
        scoreToDisplay++
        elScore.innerText === scoreToDisplay
    }, 1000)

    const { face } = gGame.gameElements
    setTimeout(setFace, 2000, face.win)
}
