// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const _ = require('lodash')

// PROBLEM: i need lodash in the client-side scripts.
// in order to do this _safely_, you have to use the context bridge
// to load code from node modules into the client's window.
// ideally, you'd do this function-by-function as you need them.

const { contextBridge } = require('electron')

// in the main world, we expose `_.isEqual` under `window.lodash.isEqual`
// thereby allowing us to use it in our client scripts.
// annoying, but necessary.
contextBridge.exposeInMainWorld("lodash", {
  isEqual: _.isEqual,
  sample: _.sample
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
