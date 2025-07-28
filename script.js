const activeTable = document.getElementById("scoresheet")
const rulesText = document.getElementById("rules_text")
const closeRules = document.getElementById("close_rules")
const rulesFrame = document.getElementById("rules_frame")

class Game {
    constructor(configuration) {
        this.configuration = configuration
        this.rounds = configuration.rounds
        this.roundNames = configuration.roundNames || []
        this.players = Array(configuration.defaultPlayerCount).fill("").map((_, i) => `Player ${i + 1}`)
        this.playerCount = configuration.defaultPlayerCount
        this.scores = this.players.map(_ => Array(this.rounds).fill(null))
        this.dealOffset = 0
    }

    static from(gameJSON) {
        const storedGame = new Game(gameJSON.configuration)
        storedGame.rounds = gameJSON.rounds
        storedGame.roundNames = gameJSON.roundNames
        storedGame.players = gameJSON.players
        storedGame.playerCount = gameJSON.playerCount
        storedGame.scores = gameJSON.scores
        storedGame.dealOffset = gameJSON.dealOffset
        return storedGame
    }

    activePlayers() {
        return this.players.slice(0, this.playerCount)
    }

    updateConfiguration(configuration) {
        this.configuration = configuration
        this.rounds = configuration.rounds
        this.roundNames = configuration.roundNames || []

        if(this.playerCount > this.configuration.maxPlayerCount || this.playerCount < this.configuration.minPlayerCount) {
            this.playerCount = this.configuration.defaultPlayerCount
        }

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

let GameConfigurations = {
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

// Initialize the game with a default configuration
let activeGame = new Game(GameConfigurations.Custom)

function createTableCell(textContent=null, header=false) {
    let cell = document.createElement(header ? "th" : "td")
    if(textContent) {
        cell.textContent = textContent
    }
    return cell
}

function validateConfiguration(ruleset) {
    const mutableSchema = {
        title: "User Custom",
        defaultPlayerCount: 4,
        minPlayerCount: 1, 
        maxPlayerCount: 8, 
        rounds: 10,
        roundNames: [],
        fixedRounds: false,
        scoreIncrement: 1,
        hasRules: false,
        rulesUrl: "",
        hasDealer: true,
        roundLabel: "Round"
    }
    
    const schema = {
        ...mutableSchema,
        ...Object.fromEntries(Object.entries(ruleset).filter(([k, v]) => {
            return k in mutableSchema && typeof v === typeof mutableSchema[k]
        })),
    }

    return schema
}

function uploadConfiguration(configuration) {
    const validated = validateConfiguration(configuration)
    const gameSelector = document.querySelector("#game_selector")

    if(!(validated.title in GameConfigurations)) { 
        let newOption = document.createElement("option")
        
        newOption.text = validated.title
        newOption.value = validated.title
        
        gameSelector.append(newOption)
    }

    GameConfigurations[validated.title] = validated
    
    let slugify = validated.title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "")
    localStorage.setItem(`custom-${slugify}`, JSON.stringify(validated))
    
    gameSelector.selectedIndex = Object.keys(GameConfigurations).indexOf(validated.title)
    gameSelector.value = validated.title

    console.log('swag')

    // // Manually trigger a change event regardless of if index changed
    let event = new Event('change')
    gameSelector.dispatchEvent(event)
}

function serializeGame() {
    localStorage.setItem(
        "stored-game", 
        JSON.stringify({
            timestamp: Date.now(),
            game: activeGame
        })
    )
}

function retrieveGame(activeGame) {
    const gameRecord = localStorage.getItem("stored-game")
    if(gameRecord) {
        const parsedGame = JSON.parse(gameRecord)
        const [timestamp, storedGame] = [parsedGame.timestamp, parsedGame.game]
        const timeElapsed = Date.now() - timestamp
        
        // If game record is under an hour old, use this instead
        if(timeElapsed < 1000 * 60 * 60) {
            return Game.from(storedGame)
        }       
    }

    return activeGame
}

const toggleRules = (_) => {
    if(rulesText.style.display  == 'none') {
        rulesText.style.display = 'inline'
    } else {
        rulesText.style.display = 'none'
    }
}

closeRules.addEventListener('click', toggleRules)

function generateScoresheet(gameState) {
    // Clear out our existing table
    activeTable.innerHTML = ""

    // Create table header
    let headerRow = activeTable.insertRow(-1)
    
    // Create relevant header rows
    let [roundHeader, gameHeader, dealHeader] = [gameState.configuration.roundLabel ?? "Round", "Game: ", "Deal"].map(v => 
        createTableCell(v, header=true)
    )

    // Create player count header row
    let playerRow = activeTable.insertRow(-1)
    let playerHeader = createTableCell("Players: ", header=true)

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
            gameState.dealOffset = 0
        }
        
        gameState.updateScores()
        serializeGame()
        generateScoresheet(gameState)
    })

    const resetButton = document.createElement("button")
    resetButton.textContent = "Reset Scores"
    resetButton.addEventListener('click', (_) => {
        document.querySelectorAll(".score_cell").forEach(cell => {
            cell.value = null
        })

        gameState.scores = gameState.scores.map(playerColumn => {
            return playerColumn.map(_ => null)
        })
        
        serializeGame()
        generateScoresheet(gameState)
    })
    
    playerHeader.append(playerCountInput, resetButton)
    playerRow.append(playerHeader)

    if(!gameState.configuration.fixedRounds) {
        let removeRowButton = document.createElement("button")
        removeRowButton.textContent = "-"
        removeRowButton.addEventListener('click', (_) => {
            if(gameState.rounds > 1) {
                gameState.rounds = gameState.rounds - 1
                serializeGame()
                generateScoresheet(gameState)
            }
        })

        let addRowButton = document.createElement("button")
        addRowButton.textContent = "+"
        addRowButton.addEventListener('click', (_) => {
            gameState.rounds = gameState.rounds + 1
            serializeGame()
            generateScoresheet(gameState)
        })

        roundHeader.append(
            document.createElement("br"), 
            removeRowButton, 
            addRowButton
        )
    }

    let cycleDealerButton = document.createElement("button")
    cycleDealerButton.textContent = "→"

    cycleDealerButton.addEventListener('click', (_) => {
        gameState.dealOffset = (gameState.dealOffset - 1) % gameState.playerCount
        
        const activePlayers = gameState.activePlayers()
        for(let i = 0; i < gameState.playerCount; i++) {
            Array.from(document.querySelectorAll(`.player_${i}_name`)).forEach(cell => {            
                cell.textContent = activePlayers[(i - gameState.dealOffset) % activePlayers.length]
            })
        }
    })
    
    dealHeader.append(document.createElement('br'), cycleDealerButton)

    roundHeader.rowSpan = 3
    dealHeader.rowSpan = 3
    
    headerRow.append(roundHeader, gameHeader)
    if(gameState.configuration.hasDealer !== false) headerRow.append(dealHeader)
    
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
            Array.from(document.querySelectorAll(`.player_${(i + activeGame.dealOffset) % activeGame.playerCount}_name`)).forEach(cell => {
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
            serializeGame()
        })
        
        playerName.appendChild(nameInput)
        playerName.className = "input_cell"
        return playerName
    })

    gameHeader.colSpan = playerCells.length
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
            inputCell.className = `player_${p}_score_cell score_cell`
            inputCell.id = `player_${p}_score_cell_${i}`
            inputCell.addEventListener('change', (event) => {
                activeGame.scores[p][i] = Number(event.target.value)
                document.getElementById(`player_${p}_sum_cell`).textContent = activeGame.scores[
                    p
                ].reduce((acc, curr) => acc + curr, 0)

                // Store the scores in local storage
                serializeGame()
            })

            scoreCell.appendChild(inputCell)
        })
        
        // Add deal cell if game has relevant
        if(gameState.configuration.hasDealer !== false) {
            let dealCell = newRow.insertCell(-1)
            let activePlayerIndex = i % gameState.activePlayers().length

            dealCell.textContent = gameState.activePlayers()[activePlayerIndex]
            dealCell.className = `player_${activePlayerIndex}_name`
        }
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
    
    // Populate custom configs (if any exist)
    let customGames = Object.keys(localStorage).filter(v => v.startsWith("custom-"))
    customGames.forEach(v => {
        let game = JSON.parse(localStorage.getItem(v))
        GameConfigurations[game.title] = game
    })
    
    // Add game selector to game row
    let gameCell = document.createElement("select")
    gameCell.append(...Object.keys(GameConfigurations).map(v => {
        let opt = document.createElement("option")
        opt.text = v
        opt.value = v
        return opt
    }))
    
    gameCell.selectedIndex = Object.keys(GameConfigurations).indexOf(gameState.configuration.title)
    gameCell.id = "game_selector"
    gameCell.addEventListener('change', (event) => {
        rulesText.style.display = "none"
        gameState.updateConfiguration(GameConfigurations[event.target.value])
        generateScoresheet(gameState)
    })

    gameHeader.append(gameCell)

    const uploadButton = document.createElement("input")
    uploadButton.id = "upload_button"
    uploadButton.type = "file"
    uploadButton.accept = ".json"
    uploadButton.style.opacity = 0
    uploadButton.style.width = 0
    uploadButton.disabled = true

    uploadButton.onchange = (event) => {
        let file = event.target.files[0]
        let reader = new FileReader()
        reader.onload = (event) => {
            let rules = JSON.parse(event.target.result)
            uploadConfiguration(rules)
        }

        reader.readAsText(file)
    }
    
    // Create a pseudo button to trigger the file upload (as file upload style is ugly)
    const psuedoButton = document.createElement("button")
    psuedoButton.textContent = "+"
    psuedoButton.className = "upload_button"

    psuedoButton.onclick = (_) => { 
        uploadButton.removeAttribute('disabled')
        uploadButton.click()
        uploadButton.setAttribute('disabled', true)
    }
    
    const helpTooltip = document.createElement("a")
    helpTooltip.href = "https://github.com/Nathansbud/scoresheet/blob/main/README.md"
    helpTooltip.innerHTML = "<sup>?</sup>"
    
    if(gameState.configuration.hasRules) {
        let rulesButton = document.createElement("button")
        rulesButton.textContent = "Rules"
        rulesButton.addEventListener('click', toggleRules)
        
        if(!gameState.configuration.rulesUrl) {
            rulesFrame.src = `rules/${gameState.configuration.title.toLowerCase()}.html`
        } else {
            console.log(gameState.configuration.rulesUrl)
            rulesFrame.src = gameState.configuration.rulesUrl
        }

        gameHeader.append(rulesButton)
    }

    gameHeader.append(psuedoButton, uploadButton, helpTooltip)
    totalCell.textContent = "Total"
}

window.onload = () => {
    // Load the game from local storage if it exists, and serialize to ensure timestamp isn't stale
    activeGame = retrieveGame(activeGame)
    serializeGame()   

    generateScoresheet(activeGame)
}