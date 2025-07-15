# Scoresheet 🎲

A (moderately) better scoresheet than the default Notes app!

## Custom Configurations

While most card games are best-served by a round-dealer structure (as they have intermittent scoring throughout the course of the game), many board games are not. Either they do not have a dealer at all, or all scoring happens in a single burst at the end of the game. "Rounds" are less relevant than scoring criteria, and so forth—there are countless variations on a score system in the world, and I couldn't possibly hope to encompass all of them.

*Scoresheet allows users to upload a custom game schema*, by uploading a custom JSON file which contains all of the necessary game metadata. An annotated example for the game [Let's Go! To Japan](https://boardgamegeek.com/boardgame/368173/lets-go-to-japan) is shown below, while an unannotated version can be found [here](./rules/custom/letsgotojapan.json):

```json
{
    "title": "Game Name",
    // Determines the player count that should be used to initialize the game
    "defaultPlayerCount": 4,
    // Sets bounds on the player count input
    "minPlayerCount": 1,
    "maxPlayerCount": 4,
    "rounds": 11,
    // Optional: Define the names of "rounds" (or scoring criteria);
    // if roundNames < rounds, these will loop!
    "roundNames": [
        "Monday", 
        "Tuesday", 
        "Wednesday", 
        "Thursday", 
        "Friday", 
        "Saturday", 
        "Sunday", 
        "Mood", 
        "Icons", 
        "Trains", 
        "Tokens"
    ],
    // Optional: Define the header of the "rounds" area (e.g. Scoring Criteria, Categories, ...)
    "roundLabel": "Scoring Criteria",  
    // Controls whether the add/remove round controls appear
    "fixedRounds": true,
    "scoreIncrement": 1,

    // Optional: If hasDealer is false, the deal column will be omitted for this game
    "hasDealer": false,

    "hasRules": true,
    
    // Optional: If hasRules is true and rulesUrl are specified, this will be rendered as an iframe; 
    // this is essentially clickjacking, so a CORS proxy may be necessary 
    "rulesUrl": "https://dork.nathansbud-cors.workers.dev/?https://www.alderac.com/wp-content/uploads/2023/03/LetsGoToJapan_Influencer_EN_1P_Rulebook_FINAL-copy.pdf"
}
```

Uploaded schemas are kept in localStorage, to allow for repeated use without needing to re-upload; schemas with identical names will overwrite existing games (including defaults)!