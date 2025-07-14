const activeTable = document.getElementById("scoresheet")
const rulesText = document.getElementById("rules_text")
const rulesFrame = document.getElementById("rules_frame")

class Game { 
    constructor(configuration) {
        this.configuration = configuration
        this.rounds = configuration.rounds
        this.roundNames = configuration.roundNames || []
        this.players = Array(configuration.defaultPlayerCount).fill("").map((_, i) => `Player ${i + 1}`)
        this.playerCount = configuration.defaultPlayerCount
        this.scores = this.players.map(_ => Array(this.rounds).fill(null))
    }

    activePlayers() {
        return this.players.slice(0, this.playerCount)
    }

    updateConfiguration(configuration) {
        this.configuration = configuration
        this.rounds = configuration.rounds
        this.roundNames = configuration.roundNames || []
        this.updateScores()
    }

    updateScores() {
        this.scores = Array(this.playerCount).fill(null).map((v, i) => {
            let targetLength = Array(this.rounds).fill(null)
            let existingScore = this.scores[i]
            if(i < this.scores.length) {
                return targetLength.map((_, si) => si < existingScore.length ? existingScore[si] : null)
            }
            return targetLength            
        })
        
        if(this.playerCount > this.players.length) {
            this.players = [...Array(this.playerCount)].map((_, i) => {
                if(i < this.players.length) return this.players[i]
                
                return `Player ${i + 1}`
            })
        }
    }
}

const GameConfigurations = {
    "Custom": {
        title: "Custom",
        defaultPlayerCount: 3,
        minPlayerCount: 1, 
        maxPlayerCount: 10, 
        rounds: 10,
        fixedRounds: false,
        hasRules: false,
        scoreIncrement: 1
    },
    "International": {
        title: "International",
        defaultPlayerCount: 3,
        minPlayerCount: 3,
        maxPlayerCount: 5,
        rounds: 8,
        roundNames: [
            "2G (10)", "1G 1R (10)", "2R (10)", "3G (10)", 
            "2G 1R (10)", "2R 1G (11)", "4G (12)", "3R (12)"
        ],
        fixedRounds: true,
        hasRules: true,
        scoreIncrement: 5 
    },
    "Cambio": {
        title: "Cambio",
        defaultPlayerCount: 4,
        minPlayerCount: 3,
        maxPlayerCount: 10,
        rounds: 10,
        fixedRounds: false,
        hasRules: true,
        scoreIncrement: 1   
    },
    "Hearts": {
        title: "Hearts",
        defaultPlayerCount: 4,
        minPlayerCount: 4,
        maxPlayerCount: 4,
        rounds: 12,
        roundNames: ["Pass Right", "Pass Left", "Pass Across", "No Pass"],
        fixedRounds: false,
        hasRules: false,
        scoreIncrement: 1
    }
}

const activeGame = new Game(GameConfigurations.Custom)
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
    
    playerCountInput.addEventListener('change', (event) => {
        const proposed = Number(event.target.value)       
        if(gameState.configuration.maxPlayerCount < event) {
            gameState.playerCount = gameState.configuration.maxPlayerCount
        } else if(gameState.configuration.minPlayerCount > event) {
            gameState.playerCount = gameState.configuration.minPlayerCount
        } else {
            gameState.playerCount = proposed
        }
        
        gameState.updateScores()
        generateScoresheet(gameState)
    })

    playerHeader.appendChild(playerCountInput)

    if(!gameState.configuration.fixedRounds) {
        let removeRowButton = document.createElement("button")
        removeRowButton.textContent = "Remove Round"
        removeRowButton.addEventListener('click', (_) => {
            if(gameState.rounds > 1) {
                gameState.rounds = gameState.rounds - 1
                generateScoresheet(gameState)
            }
        })

        let addRowButton = document.createElement("button")
        addRowButton.textContent = "Add Round"
        addRowButton.addEventListener('click', (_) => {
            gameState.rounds = gameState.rounds + 1
            generateScoresheet(gameState)
        })

        roundHeader.append(
            document.createElement("br"), 
            removeRowButton, 
            addRowButton
        )
    }

    roundHeader.rowSpan = 2
    dealHeader.rowSpan = 2
    
    headerRow.append(roundHeader, playerHeader, dealHeader)
    // Configure player names
    let headerSubrow = activeTable.insertRow(-1)
    headerSubrow.id = "player_header"
    
    let playerCells = gameState.activePlayers().map((v, i) => {
        let playerName = createTableCell(null, header=true)
        let nameInput = document.createElement("input")
        nameInput.type = "text"
        nameInput.value = v

        nameInput.addEventListener('change', (event) => {
            activeGame.players[i] = event.target.value
            Array.from(document.querySelectorAll(`.player_${i}_name`)).forEach(cell => {
                cell.textContent = event.target.value
            })
        })

        // Clear input when the user clicks to make it easier to edit
        nameInput.addEventListener('focus', (event) => {
            nameInput.value = ''
        })

        // Set name input value to active player value, to reflect change (or lack thereof)
        nameInput.addEventListener('focusout', (event) => {
            nameInput.value = activeGame.players[i]
        })
        
        playerName.appendChild(nameInput)
        playerName.className = "input_cell"
        return playerName
    })

    playerHeader.colSpan = playerCells.length
    headerSubrow.append(...playerCells)
    
    // Create game rounds
    for(let i = 0; i < gameState.rounds; i++) {
        let newRow = activeTable.insertRow(-1)
        newRow.insertCell(-1).textContent = gameState.roundNames.length > 0 ? gameState.roundNames[i % gameState.roundNames.length] : `${i + 1}`
        gameState.activePlayers().map((_, p) => {
            let scoreCell = newRow.insertCell(-1)
            scoreCell.className = "input_cell"

            let inputCell = document.createElement("input")
            inputCell.type = "number"
            inputCell.value = activeGame.scores[p][i]
            inputCell.step = gameState.configuration.scoreIncrement
            inputCell.className = `player_${p}_score_cell`
            inputCell.id = `player_${p}_score_cell_${i}`
            inputCell.addEventListener('change', (event) => {
                activeGame.scores[p][i] = Number(event.target.value)
                document.getElementById(`player_${p}_sum_cell`).textContent = activeGame.scores[
                    p
                ].reduce((acc, curr) => acc + curr, 0)
            })

            scoreCell.appendChild(inputCell)
        })
        
        let dealCell = newRow.insertCell(-1)
        let activePlayerIndex = i % gameState.activePlayers().length

        dealCell.textContent = gameState.activePlayers()[activePlayerIndex]
        dealCell.className = `player_${activePlayerIndex}_name`
    }

    // Configure score total row
    const totalsRow = activeTable.insertRow(-1)
    let totalCell = totalsRow.insertCell(-1)
    
    gameState.activePlayers().map((_, i) => {
        let playerCell = totalsRow.insertCell(-1)
        playerCell.textContent = gameState.scores[i].reduce((acc, curr) => acc + curr, 0)
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
    gameCell.addEventListener('change', (event) => {
        rulesText.style.display = "none"
        gameState.updateConfiguration(GameConfigurations[event.target.value])
        generateScoresheet(gameState)
    })

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