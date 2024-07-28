class Game {
    constructor(min, max, rounds, hasRules = false) {
        this.minimumPlayers = min
        this.maximumPlayers = max
        this.rounds = rounds
        this.hasRules = hasRules
    }
}

const Games = {
    DEFAULT: new Game(null, null, null, false),
    INTERNATIONAL: new Game(2, 5, ["2G", "1G 1R", "2R", "3G", "2G 1R", "2R 1G", "4G", "3R"], true),
    CAMBIO: new Game(null, null, null, false)
}

let activeGame = Games.INTERNATIONAL

let playerCount = 5;
const scoresheet = document.getElementById("scoresheet");
const playerChanger = document.getElementById("player_count");
const rulesFrame = document.getElementById("rules_frame");

window.onload = function() {
    setupScoresheet();
    setupListeners();
    changePlayers(3);
    updatePlayerNames();
}

playerChanger.addEventListener("change", (e) => {
    let proposed = Math.floor(parseInt(e.target.value));
    if(Number.isNaN(proposed)) {
        playerChanger.value = playerCount;
        proposed = playerCount;
        return;
    } else if(proposed > 5) {
        playerChanger.value = 5;
        proposed = 5;
    } else if(proposed < 3) {
        playerChanger.value = 3;
        proposed = 3;
    }
    
    console.log(proposed);

    changePlayers(proposed);
    updatePlayerNames();
})

function setupScoresheet() {
    for(let i = 0; i < activeGame.rounds.length; i++) {
        let newRound = document.createElement("tr")
        newRound.setAttribute("id", "round_"+(i+1))
        newRound.setAttribute("class", "round")
        
        let roundCell = document.createElement("td")
        roundCell.setAttribute("class", "round_name")
        
        let cardCount = 0
        let cardParts = activeGame.rounds[i].split(' ')
        for(let p = 0; p < cardParts.length; p++) {
            if(cardParts[p][1] == "G") {
                cardCount += 3 * parseInt(cardParts[p][0])
            } else {
                cardCount += 4 * parseInt(cardParts[p][0])
            }
        }

        roundCell.innerHTML = activeGame.rounds[i] + " (" + ((cardCount < 10) ? (10) : cardCount) + ")"
        newRound.appendChild(roundCell)
        
        let playerCells = []
        for(let j = 0; j < playerCount; j++) {
            playerCells[j] = document.createElement("td")
            playerCells[j].innerHTML = '<input type="number" min=0 step=5 class="p'+(j+1)+'_scores" id="p'+(j+1)+'_r'+(i+1)+'_score">'
            newRound.appendChild(playerCells[j])
        }

        let dealCell = document.createElement("td")
        dealCell.setAttribute("class", "player_deal")
        newRound.append(dealCell)

        scoresheet.appendChild(newRound)
    }
    let finalRow = document.createElement("tr")
    
    let finalCellLabel = document.createElement("td")
    finalCellLabel.textContent = "Total"
    finalRow.appendChild(finalCellLabel)

    for(let i = 0; i < playerCount; i++) {
        let finalCellScore = document.createElement("td")
        finalCellScore.innerHTML = "<span class='final_scores' id='p"+(i+1)+"_final'>0</span>"
        finalRow.appendChild(finalCellScore)
    }

    let ruleCell = document.createElement("td")
    ruleCell.innerHTML = "<button id='rules'>Rules</button>" 
    finalRow.appendChild(ruleCell)

    scoresheet.append(finalRow)

    scoresheet.style.width = "100%";
    scoresheet.style.height = "100%";

    rulesFrame.src = "rules/international.html"
}

function updatePlayerNames() {
    let dealCells = document.getElementsByClassName("player_deal")
    for(let i = 0; i < dealCells.length; i++) {
        dealCells[i].innerHTML = document.getElementById("p"+((i%playerCount)+1)+"_name").value
    }
}

function changePlayers(count) {
    let fourCells = document.querySelectorAll("#scoresheet tr > td:nth-child(5)");
    let fiveCells = document.querySelectorAll("#scoresheet tr > td:nth-child(6)");
    switch(count) {
        case 5:
            Array.from(fourCells).forEach(c => c.style.display = "table-cell");
            Array.from(fiveCells).forEach(c => c.style.display = "table-cell");
            break;
        case 4:
            Array.from(fourCells).forEach(c => c.style.display = "table-cell");
            Array.from(fiveCells).forEach(c => c.style.display = "none");
            break;
        case 3:
            Array.from(fourCells).forEach(c => c.style.display = "none");
            Array.from(fiveCells).forEach(c => c.style.display = "none");
            break;
    }

    document.getElementById("player_header").setAttribute("colspan", count);
    document.getElementById("player_4").style.display = count > 3 ? "table-cell" : "none";
    document.getElementById("player_5").style.display = count > 4 ? "table-cell" : "none";
    playerCount = count;
}

function setupListeners() {
    document.getElementById('rules_text').style.display = 'none';
    for(let i = 0; i < activeGame.rounds.length; i++) {
        for(let j = 0; j < playerCount; j++) {
            document.getElementById("p"+(j+1)+"_r"+(i+1)+"_score").addEventListener("change", function() {
                let scores = document.getElementsByClassName("p"+(j+1)+"_scores")
                let score = 0

                for(let k = 0; k < scores.length; k++) {
                    if(scores[k].value) score += parseInt(scores[k].value, 10)
                }
                
                document.getElementById("p"+(j+1)+"_final").innerHTML = score
            })
        }
    }

    for(let i = 0; i < document.getElementsByClassName("player_name").length; i++) {
        document.getElementsByClassName("player_name")[i].addEventListener('change', updatePlayerNames)  
    }
    document.getElementById('rules').addEventListener('click', function() {
       if(document.getElementById('rules_text').style.display == 'none') {
            document.getElementById('rules_text').style.display = 'inline';
        } else {
            document.getElementById('rules_text').style.display = 'none'; 
        }
    })
}

