const activeTable = document.getElementById("scoresheet")
const rulesText = document.getElementById("rules_text")
const rulesFrame = document.getElementById("rules_frame")

class Player {
    constructor(name) {
        self.name = name
    }
}

class GameConfig { 
    constructor(
        title="",
        minPlayerCount = 1, 
        maxPlayerCount = 10, 
        fixedRounds = false,
        hasRules = false,
        scoreIncrement = 1
    ) {
        this.title = title
        this.hasRules = hasRules

        // Relevant for things like International, which go up by 5 minimum each card
        this.scoreIncrement = scoreIncrement
        this.fixedRounds = fixedRounds

        this.minPlayerCount = minPlayerCount
        this.maxPlayerCount = maxPlayerCount
    }
}

class Game { 
    constructor(players, configuration) {
        this.configuration = configuration

        this.players = players 
        this.playerCount = 3
        
        this.rounds = 10
      
        this.scores = players.map(_ => Array(this.rounds).map(_ => 0))
    }

    updateConfiguration(configuration) {
        this.configuration = configuration
    }
}

const GameConfigurations = {
    "Custom": new GameConfig("Custom"),
    "International": new GameConfig(
        title="International",
        minPlayerCount=1,
        maxPlayerCount=5,
        fixedRounds=true,
        hasRules=true,
        scoreIncrement=5
    ),
    "Cambio": new GameConfig(
        title="Cambio",
        minPlayerCount=3,
        maxPlayerCount=10,
        fixedRounds=false,
        hasRules=true,
        scoreIncrement=1
    ),
}
const activeGame = new Game(["Player 1", "Player 2", "Player 3"], GameConfigurations.Custom)
function createTableCell(textContent=null, header=false) {
    let cell = document.createElement(header ? "th" : "td")
    if(textContent) {
        cell.textContent = textContent
    }
    return cell
}

function generateScoresheet(gameState) {
    // Clear out our existing table
    activeTable.innerHTML = ""
    
    // Create table header
    let headerRow = activeTable.insertRow(-1)
    
    // Create relevant header rows
    let [roundHeader, playerHeader, dealHeader] = ["Round", "Players: ", "Deal"].map(v => 
        createTableCell(v, header=true)
    )

    // Create input for player count
    let playerCountInput = document.createElement("input")
    playerCountInput.type = "number"
    playerCountInput.min = gameState.configuration.minPlayerCount
    playerCountInput.max = gameState.configuration.maxPlayerCount
    playerCountInput.value = gameState.playerCount

    playerHeader.appendChild(playerCountInput)

    roundHeader.rowSpan = 2
    dealHeader.rowSpan = 2
    
    headerRow.append(roundHeader, playerHeader, dealHeader)

    // Configure player names
    let headerSubrow = activeTable.insertRow(-1)
    headerSubrow.id = "player_header"

    let playerCells = gameState.players.map(v => createTableCell(v, header=true))
    playerHeader.colSpan = playerCells.length

    headerSubrow.append(...playerCells)
    
    // Create game rounds
    for(let i = 0; i < gameState.rounds; i++) {
        let newRow = activeTable.insertRow(-1)
        newRow.insertCell(-1).textContent = `${i + 1}`
        gameState.players.map((_, p) => {
            let scoreCell = newRow.insertCell(-1)

            let inputCell = document.createElement("input")
            inputCell.type = "number"
            // inputCell.value = 0
            inputCell.step = gameState.configuration.scoreIncrement
            inputCell.className = `player_${p}_score_cell`
            inputCell.id = `player_${p}_score_cell_${i}`
            inputCell.onchange = (event) => {
                activeGame.scores[p][i] = Number(event.target.value)
                document.getElementById(`player_${p}_sum_cell`).textContent = activeGame.scores[
                    p
                ].reduce((acc, curr) => acc + curr, 0)
            }

            scoreCell.appendChild(inputCell)
        })
        
        newRow.insertCell(-1).textContent = gameState.players[i % gameState.players.length]
    }

    // Configure score total row
    const totalsRow = activeTable.insertRow(-1)
    let totalCell = totalsRow.insertCell(-1)
    
    gameState.players.map((_, i) => {
        let playerCell = totalsRow.insertCell(-1)
        playerCell.textContent = 0
        playerCell.className = "sum_cell"
        playerCell.id = `player_${i}_sum_cell`
        playerCell.dataset.player = i
    })
    
    let rulesCell = totalsRow.insertCell(-1)
    let gameCell = document.createElement("select")
    gameCell.append(...Object.keys(GameConfigurations).map(v => {
        let opt = document.createElement("option")
        opt.text = v
        opt.value = v
        return opt
    }))

    gameCell.selectedIndex = Object.keys(GameConfigurations).indexOf(gameState.configuration.title)
    gameCell.onchange = (event) => {
        rulesText.style.display = "none"
        gameState.updateConfiguration(GameConfigurations[event.target.value])
        generateScoresheet(gameState)
    }

    rulesCell.append(gameCell)
    if(gameState.configuration.hasRules) {
        let rulesButton = document.createElement("button")
        rulesButton.textContent = "Rules"
        rulesButton.onclick = (_) => {
            if(rulesText.style.display  == 'none') {
                rulesText.style.display = 'inline'
            } else {
                rulesText.style.display = 'none'
            }
        }

        console.log(gameState.configuration)

        rulesFrame.src = `rules/${gameState.configuration.title.toLowerCase()}.html`
        rulesCell.append(
            document.createElement("br"), 
            document.createElement("br"), 
            rulesButton
        )
    }

    totalCell.textContent = "Total"
}

window.onload = () => {
    generateScoresheet(activeGame);
}