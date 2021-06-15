// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// here we are in the main window
// we need:
// the party's current state,
// what sprites match up to that current state,
// and...maybe just do text for now.

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
  // get a reference to the element with id divID
  // clear its children
  // add an img tag as its child,
  // with src = `charImage`

  var slotDiv = document.getElementById(divID)
  slotDiv.innerHTML = '<img src="' + charImage + '" class="sprite">'
}

var newSetOfJobs = function(currentParty, newParty) {
  jobsInCurrentParty = []
  jobsInNewParty = []

  for (i = 0; i < currentParty.length; i++) {
    jobsInCurrentParty[i] = currentParty[i].job
  }

  for (i = 0; i < newParty.length; i++) {
    jobsInNewParty[i] = newParty[i].job
  }

  console.log(`jobsInCurrentParty: ${jobsInCurrentParty}`)
  console.log(`jobsInNewParty: ${jobsInNewParty}`)

  currentSet = new Set(jobsInCurrentParty)
  newSet = new Set(jobsInNewParty)

  return (currentSet != newSet)
}

var updateHints = function(newParty) {
  // if we have a new set of jobs with this new party,
  // then make a new request to Enkibot with the given set of jobs
  if (newSetOfJobs(party, newParty)) {
    console.log("time to replace the internal store for hints!")
  }
}

var updateParty = function(partyData) {
  asChar = []

  for (i = 0; i < partyData.length; i++) {
    asChar[i] = new Character(partyData[i].id, partyData[i].job)
  }

  updateHints(asChar)

  party = asChar
}

var renderParty = function() {
  for (i = 0; i < party; i++) {
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

var interval = setInterval(function() {
  console.log(party)
  fetch("http://localhost:3333/party")
    .then(response => response.json())
    .then(partyData => onFetchParty(partyData))
}, 500)
