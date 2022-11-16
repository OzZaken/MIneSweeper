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
function getDateForDisplay(now) {
    const newDate = new Date(now)
    const minutes = newDate.getMinutes()
    const seconds = newDate.getSeconds()
    const minutesDisplay = (minutes + '').padStart(2, '0')
    const secondsDisplay = (seconds + '').padStart(2, '0')
    return `${minutesDisplay}:${secondsDisplay}`
}

// Local Storage
function saveToStorage(key, value) {
    const str = JSON.stringify(value)
    localStorage.setItem(key, str)
}
function loadFromStorage(key) {
    const str = localStorage.getItem(key)
    return JSON.parse(str)
}
