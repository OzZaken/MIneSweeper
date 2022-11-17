'use strict'

function _getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}
function _getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
function _getRandomColor() {
    let colorLetters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
        color += colorLetters[Math.floor(Math.random() * 16)]
    }
    return color
}

// Set element innerText 
function renderEl(el, innerText) {
    el.innerText = innerText
}

// time
function _getDateForDisplay(now) {
    const newDate = new Date(now)
    const minutes = newDate.getMinutes()
    const seconds = newDate.getSeconds()
    const minutesDisplay = (minutes + '').padStart(2, '0')
    const secondsDisplay = (seconds + '').padStart(2, '0')
    return `${minutesDisplay}:${secondsDisplay}`
}

// Local Storage
function _saveToStorage(key, value) {
    const str = JSON.stringify(value)
    localStorage.setItem(key, str)
}
function _loadFromStorage(key) {
    const str = localStorage.getItem(key)
    return JSON.parse(str)
}