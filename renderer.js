"use strict";
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

var jobs = [
  'Knight',  // 0
  'Monk',  // 1
  'Thief',  // 2
  'Dragoon', // 3
  'Ninja',  // 4 <...>
  'Samurai',
  'Berserker',
  'Ranger',
  'Mystic Knight',
  'White Mage',
  'Black Mage',
  'Time Mage',
  'Summoner',
  'Blue Mage',
  'Red Mage',
  'Beastmaster',
  'Chemist',
  'Geomancer',
  'Bard',
  'Dancer',
  'Necromancer',
  'Oracle',
  'Cannoneer',
  'Gladiator',
  'Mimic',
  'Freelancer',  // <...> 25
]

var hintManager = {
  currentHintSection: null,
  currentHintIndex: null
}

var hintSections = []

function Character(id, job) {
  this.id = id
  this.job = job
}

Character.prototype.toString = function charAsString() {
  return `${this.id}: ${this.job}`
}

var party = [
  new Character("unoccupied", "42"),
  new Character("unoccupied", "42"),
  new Character("unoccupied", "42"),
  new Character("unoccupied", "42")
]

var setDivImage = function(divID, charImage) {
  var slotDiv = document.getElementById(divID)
  slotDiv.innerHTML = '<img src="' + charImage + '" class="sprite">'
}

var newSetOfJobs = function(currentSet, newSet) {
  // see preload.js for explanation on what the hell
  // `window.lodash.isEqual` is
  return !(window.lodash.isEqual(currentSet, newSet))
}

var getJobFormData = function(newSet) {
  var jobArray = Array.from(newSet)

  if (jobArray.length == 0) {
    return;
  }

  var data = new FormData()

  for (var i = 0; i < 4; i++) {
    if (jobArray[i] === undefined) {
      // TODO: translate integer representations to Enkibot API values
      data.set(`job${i + 1}`, jobs[jobArray[0]])
    } else {
      data.set(`job${i + 1}`, jobs[jobArray[i]])
    }
  }

  return data
}

var validJobsToGetDataFor = function(newSet) {
  // INTENT: if there's NOTHING in set that isn't `42`, don't make the call

  // remove all members of set that are `42`
  // (this is not actually a job, and just represents an unoccupied slot)
  newSet.delete('42')
  // check and see if this set still has any members
  // if so, there are valid jobs in it
  // if not, then there aren't
  return (Array.from(newSet).length != 0)
}

var makeHintSection = function(sectionText) {
  var splitByNewline = sectionText.split("\n")

  var sectionName = splitByNewline[0].trim()

  if ((sectionName === "Intro") || (sectionName === "Version Differences")) {
    return {
      section: {},
      shouldIgnore: true
    }
  }

  var hints = []

  var i;

  for (var i = 0; i < splitByNewline.length; i++) {
    if (i == 0) {
      // skip the first element (the section name) for building hints
      continue
    }

    // Q: what the fuck?
    // A: hints take this form:
    // * Here be a hint for you!
    // and we want only the stuff after the *
    // also no, this is not optimal or efficient, but eh

    if (splitByNewline[i] === "") {
      continue
    }

    var hint = splitByNewline[i].split("*")[1].trim()

    if (hint === "Here are some general tips for your jobs!") {
      continue
    }

    hints.push(hint)
  }

  return {
    section: {
      name: sectionName,
      hints: hints
    },
    shouldIgnore: false
  }
}

var processHintText = function(text) {
  // text takes this form:

  // ## Some Hint Section
  // * Some Hint
  // * [JOB] Some Hint About A Specific Job (or lack thereof)

  var sections = []

  var splitBySectionHeader = text.split('##')

  for (var i = 0; i < splitBySectionHeader.length; i++) {
    if (splitBySectionHeader[i] === "") {
      // if section is blank don't do anything
      continue
    }

    let { section, shouldIgnore } = makeHintSection(splitBySectionHeader[i])

    if (!(shouldIgnore)) {
      sections.push(section)
    }
  }

  hintSections = sections
}

var updateHints = function(currentParty, newParty) {
  var jobsInCurrentParty = []
  var jobsInNewParty = []

  for (var i = 0; i < currentParty.length; i++) {
    jobsInCurrentParty[i] = currentParty[i].job
  }

  for (var i = 0; i < newParty.length; i++) {
    jobsInNewParty[i] = newParty[i].job
  }

  var currentSet = new Set(jobsInCurrentParty)
  var newSet = new Set(jobsInNewParty)

  if (newSetOfJobs(currentSet, newSet) && validJobsToGetDataFor(newSet)) {
    var jobFormData = getJobFormData(newSet)

    fetch("https://enkibot-prime.herokuapp.com/hints/", {
      body: jobFormData,
      method: "post"
    }).then(response => response.text())
    .then(text => {
      processHintText(text)
    })
  }
}

var updateParty = function(partyData) {
  var asChar = []

  for (var i = 0; i < partyData.length; i++) {
    asChar[i] = new Character(partyData[i].id, partyData[i].job)
  }

  updateHints(party, asChar)

  party = asChar
}

var renderParty = function() {
  for (var i = 0; i < party.length; i++) {
    var divID = `slot${i + 1}`
    if (party[i].id == 'unoccupied') {
      var charImage = `sprites/unoccupied.png`
      setDivImage(divID, charImage)
    } else {
      var charImage = `sprites/${party[i].id}/${party[i].job}.png`
      setDivImage(divID, charImage)
    }
  }
}

var onFetchParty = function(partyData) {
  // our data is of the following form:
  // [
  //   slot1,
  //   slot2,
  //   slot3,
  //   slot4
  // ]
  // where a slot looks like this:
  // {
  //   id: "<the character in the slot, or `unoccupied` if blank>",
  //   job: "<the id of the job of the character in the slot, or 42 if unoccupied>",
  // }

  updateParty(partyData)
  renderParty()
}

var fetchParty = setInterval(function() {
  fetch("http://localhost:3333/party")
    .then(response => response.json())
    .then(partyData => onFetchParty(partyData))
}, 500)

var noCurrentHintSection = function(hintManager) {
  return (hintManager.currentHintSection === null)
}

var finishedHintsForSection = function(hintManager) {
  // e.g. if currentHintIndex = 7, then we just printed the seventh hint,
  // and moved onto the eighth,
  // and if hintManager.currentHintSection.hints.length = 7,
  // then there is no eighth hint to move onto,
  // and we need to select a new section
  return (hintManager.currentHintIndex >= hintManager.currentHintSection.hints.length)
}

var displayHint = setInterval(function() {
  if (hintSections.length > 0) {
    if (noCurrentHintSection(hintManager) || finishedHintsForSection(hintManager)) {
      hintManager.currentHintSection = window.lodash.sample(hintSections)
      hintManager.currentHintIndex = 0
    }

    var hintTitle = document.getElementById("hint-section")
    hintTitle.innerText = hintManager.currentHintSection.name

    var hintText = document.getElementById("hint-text")
    hintText.innerText = hintManager.currentHintSection.hints[hintManager.currentHintIndex]

    hintManager.currentHintIndex += 1
  }
}, 8000)
