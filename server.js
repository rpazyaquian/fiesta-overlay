const express = require('express')
const app = express()
const port = 3333

var party = [
  {
    id: "unoccupied",
    job: "42"
  },
  {
    id: "unoccupied",
    job: "42"
  },
  {
    id: "unoccupied",
    job: "42"
  },
  {
    id: "unoccupied",
    job: "42"
  }
]

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/party', (req, res) => {
  res.send(party)
})

app.post('/party', (req, res) => {
  party = JSON.parse(req.body.payload)
  res.send(party)
})

app.listen(port, () => {
  console.log(`Listening for updates and queries at http://localhost:${port}.`)
})
