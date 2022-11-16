'use strict'

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}
function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Timer
function timerStart() {
    console.log('timerStart')
    gGame.startTime = Date.now()
    gGame.timerInterVal = setInterval(timerUpdate, 1111, gGame.startTime)
}
function timerUpdate(startTime) {
    if (!gGame.isOn) return
    const timePast = Date.now() - startTime
    document.querySelector('.timer').innerText = getDateForDisplay(timePast)
}
function timerStop() {
    let { timerInterVal } = gGame
    clearInterval(timerInterVal)
    timerInterVal = null
}
function timerReset() {
    timerStop()
    document.querySelector('.timer').innerText = '00:00'
}
function getDateForDisplay(now) {
    const newDate = new Date(now)
    const minutes = newDate.getMinutes()
    const seconds = newDate.getSeconds()
    const minutesDisplay = (minutes + '').padStart(2, '0')
    const secondsDisplay = (seconds + '').padStart(2, '0')
    return `${minutesDisplay}:${secondsDisplay}`
}