import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmnAK5EBYza79MQJmU4nTKVIzTjeOmEhw",
    authDomain: "cerrado-volei.firebaseapp.com",
    projectId: "cerrado-volei",
    storageBucket: "cerrado-volei.firebasestorage.app",
    messagingSenderId: "687787718559",
    appId: "1:687787718559:web:47e3fddd979dee4fd06faa"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let teams = [];
let selectedPlayer = null;
let selectedEmptySpace = null;
let backupUndo = [];

const playerForm = document.getElementById('playerForm');
const teamsContainer = document.getElementById('teams');
const undoBtn = document.getElementById('undo-btn');
const twoWoman = document.getElementById("cb5");

db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        teams = data.teams;

        const isRuleActive = data.isRuleActive || false; 
        document.getElementById("cb5").checked = isRuleActive;

        renderTeams();
    } else {
        console.log("No teams data found!");
    }
});

function saveTeamsToFirestore() {
    const teamsData = teams.map(team => ({
        players: team.players.map(player => player ? {
            name: player.name,
            isSetter: player.isSetter,
            isFemale: player.isFemale,
            wins: player.wins || 0
        } : null),
        wins: team.wins || 0
    }));

    const isRuleActive = document.getElementById("cb5").checked;

    db.collection('teams').doc('currentTeams').get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                backupUndo = data.teams;
            }
            return db.collection('teams').doc('currentTeams').set({ teams: teamsData, isRuleActive: isRuleActive });
        })
        .then(() => {
            console.log("Teams saved successfully!");
        })
        .catch(error => {
            console.error("Error saving teams: ", error);
        });
}

twoWoman.addEventListener('click', saveTeamsToFirestore);

undoBtn.addEventListener('click', function () {
    reRender(backupUndo);
});

function redistributeTeam(winningTeamIndex, lostOrWin) {
    const winningTeam = teams[winningTeamIndex];

    if (lostOrWin === 'win') {
        const confirmRedistribute = confirm(`O time de ${winningTeam.players[0].name} GANHOU e todos os jogadores receberão 1 vitória! Confirma que o time vencedor será redistribuído?`)

        if(confirmRedistribute) {
            redistributeLosingTeam(winningTeam);
            teams.splice(winningTeamIndex, 1);
        }
    } else {
        const confirmRedistribute = confirm(`Que pena, perderam... Deseja Redistribuir o time de ${winningTeam.players[0].name}?`)

        if(confirmRedistribute) {
            redistributeLosingTeam(winningTeam);
            teams.splice(winningTeamIndex, 1);
        }
    }

    renderTeams();
    saveTeamsToFirestore();
}

function selectPlayer(player, playerElement) {
    if (selectedPlayer) {
        if (selectedPlayer.player === player) {
            selectedPlayer.element.classList.remove('player-selected');
            selectedPlayer = null;

            renderTeams();
            return;
        }

        const confirmSwap = confirm(`Deseja trocar ${selectedPlayer.player.name} por ${player.name}?`);
        if (confirmSwap) {
            swapPlayers(selectedPlayer.player, player);
            selectedPlayer.element.classList.remove('player-selected');
            selectedPlayer = null;
            renderTeams();
        } else {
            selectedPlayer.element.classList.remove('player-selected');
            selectedPlayer = null;
            renderTeams();
        }

        return;
    }

    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    }

    selectedPlayer = { player: player, element: playerElement };
    playerElement.classList.add('player-selected');
}

function swapPlayers(playerA, playerB) {
    const teamAIndex = teams.findIndex(team => team.players.includes(playerA));
    const teamBIndex = teams.findIndex(team => team.players.includes(playerB));

    const playerAIndex = teams[teamAIndex].players.indexOf(playerA);
    const playerBIndex = teams[teamBIndex].players.indexOf(playerB);

    teams[teamAIndex].players[playerAIndex] = playerB;
    teams[teamBIndex].players[playerBIndex] = playerA;
    saveTeamsToFirestore();
}

function selectEmptySpace(playerElement, teamIndex, playerIndex) {
    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
    }

    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('player-selected');
        selectedPlayer = null;
    }

    selectedEmptySpace = { element: playerElement, teamIndex: teamIndex, playerIndex: playerIndex };
    playerElement.classList.add('player-empty-selected');

    renderTeams();
}

function addPlayerToTeam(player) {
    player.wins = player.wins || 0;

    if (selectedEmptySpace) {
        const team = teams[selectedEmptySpace.teamIndex];
        team.players[selectedEmptySpace.playerIndex] = player;

        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    } else {
        for (let team of teams) {
            if (canAddPlayerToTeam(team, player)) {
                team.players.push(player);
                return;
            }
        }

        const newTeam = { players: [] };
        newTeam.players.push(player);
        teams.push(newTeam);
    }
}

function canAddPlayerToTeam(team, player) {
    const isSetterInTeam = team.players.some(p => p && p.isSetter);
    const isFemaleInTeam = team.players.some(p => p && p.isFemale);
    const countFemaleInTeam = team.players.filter(p => p && p.isFemale).length;

    const teamNotFull = team.players.length < 6;


    if (!teamNotFull) return false;
    if (player.isSetter && isSetterInTeam) return false;

    if(twoWoman.checked) {
        if (player.isFemale && countFemaleInTeam >= 2) return false;
    } else {
        if (player.isFemale && isFemaleInTeam) return false;
    }

    return true;
}

document.getElementById('saideira').addEventListener('click', function () {
    let newArray = []

    for (let team of teams) {
        team.players.forEach(player => {
            newArray.push(player);
        })
    }

    const confirmMix = confirm('Deseja misturar todos os jogadores?');

    if (confirmMix) {
        teams = [];
        const mixPlayers = shuffleArray(newArray);
        mixPlayers.forEach(player => {
            addPlayerToTeam(player);
        });
    }

    renderTeams();
    saveTeamsToFirestore();
});

playerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const playerName = document.getElementById('playerName').value;
    const isSetter = document.getElementById('isSetter').checked;
    const isFemale = document.getElementById('isFemale').checked;

    const newPlayer = {
        name: playerName,
        isSetter: isSetter,
        isFemale: isFemale
    };

    addPlayerToTeam(newPlayer);
    renderTeams();

    playerForm.reset();
    saveTeamsToFirestore();
});





function redistributeLosingTeam(losingTeam) {
    let remainingPlayers = [];
    let setter = null;
    let femalePlayer = null;

    losingTeam.wins = 0;

    losingTeam.players.forEach(player => {
        if (player) {
            if (player.isSetter) {
                setter = player;
            } else if (player.isFemale) {
                femalePlayer = player;
            } else {
                remainingPlayers.push(player);
            }
        }
    });

    if (setter) {
        realocatePlayer(setter);
    }

    if (femalePlayer) {
        realocatePlayer(femalePlayer);
    }

    remainingPlayers = shuffleArray(remainingPlayers);

    remainingPlayers.forEach(player => {
        realocatePlayer(player);
    });
    saveTeamsToFirestore();
}

function realocatePlayer(player) {
    for (let team of teams) {
        if (canAddPlayerToTeam(team, player)) {
            for (let i = 0; i < 6; i++) {
                if (!team.players[i]) {
                    team.players[i] = player;
                    return;
                }
            }
        }
    }

    const newTeam = { players: [] };
    newTeam.players.push(player);
    teams.push(newTeam);
    saveTeamsToFirestore();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createRedistributeButton(teamIndex) {
    const redistributeButton = document.createElement('div');
    redistributeButton.textContent = 'Redistribuir Time';
    redistributeButton.classList.add('redistribute-button')

    const winBtn = document.createElement('button');
    winBtn.textContent = 'Venceu'
    winBtn.classList.add('win-btn');

    const lostBtn = document.createElement('button');
    lostBtn.textContent = 'Perdeu'
    lostBtn.classList.add('lost-btn');

    redistributeButton.classList.add('redistribute-button');
    redistributeButton.addEventListener('click', function () {
        redistributeButton.textContent = '';

        redistributeButton.appendChild(winBtn);
        redistributeButton.appendChild(lostBtn);

        winBtn.addEventListener('click', function () {
            const winningTeam = teams[teamIndex];
            const lostOrWin = 'win';

            winningTeam.players.forEach(player => {
                if (player) {
                    player.wins = (player.wins || 0) + 1;
                }
            });

            redistributeTeam(teamIndex, lostOrWin);
        })

        lostBtn.addEventListener('click', function () {
            const winningTeam = teamIndex ? 0 : 1;
            const thisWinningTeam = teams[winningTeam];
            const lostOrWin = 'lost';

            thisWinningTeam.players.forEach(player => {
                if (player) {
                    player.wins = (player.wins || 0) + 1;
                }
            });

            redistributeTeam(teamIndex, lostOrWin);
        })
    });
    return redistributeButton;
}

function createTeamElement(team, title, teamIndex = null) {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('team');

    const teamTitle = document.createElement('h3');
    teamTitle.textContent = title;
    teamDiv.appendChild(teamTitle);

    const playerList = document.createElement('div');
    playerList.style.display = 'flex';
    playerList.classList.add('spaceTotal')
    playerList.style.flexDirection = 'column';

    for (let i = 0; i < 6; i++) {
        const playerItem = document.createElement('div');
        playerItem.classList.add('player-space');

        if (team.players[i]) {
            const player = team.players[i];
            const playerName = `${player.name}`;
            const tagP = document.createElement('p');
            tagP.textContent = playerName;
            const tagSpan = document.createElement('span');
            tagSpan.textContent = `${player.wins}`

            const btnDelete = document.createElement('button');
            btnDelete.textContent = '✖'
            btnDelete.id = 'removePlayerBtn';

            playerItem.appendChild(tagP);
            playerItem.appendChild(tagSpan)
            playerItem.appendChild(btnDelete);

            if (player.isSetter) playerItem.classList.add('player-setter');
            if (player.isFemale) playerItem.classList.add('player-female');
            playerItem.addEventListener('click', function (event) {
                event.stopPropagation();
                selectPlayer(player, playerItem);
                tagSpan.style.display = 'none'

                btnDelete.id = 'removePlayerBtnShow'
                btnDelete.addEventListener('click', function() {
                    const confirmDelete = confirm(`Deseja remover ${player.name}?`);

                    if (confirmDelete) {
                        if (selectedPlayer) {
                            for (let team of teams) {
                                const playerIndex = team.players.indexOf(selectedPlayer.player);
                                
                                if (playerIndex !== -1) {
                                    team.players.splice(playerIndex, 1);
                                    selectedPlayer = null;
                                    break;
                                }
                            }
                    
                            selectedPlayer = null;
                            this.style.display = 'none';
                    
                            reRender(teams);
                    
                            setTimeout(() => {
                                selectedPlayer = null;
                            }, 100);
                        }
                    }
                })
            });
        } else {
            playerItem.textContent = 'ʕ•́ᴥ•̀ʔっ';
            playerItem.classList.add('player-empty');
            playerItem.addEventListener('click', function (event) {
                event.stopPropagation();
                selectEmptySpace(playerItem, teams.indexOf(team), i);
            });
            if (selectedEmptySpace && selectedEmptySpace.teamIndex === teams.indexOf(team) && selectedEmptySpace.playerIndex === i) {
                playerItem.classList.add('player-empty-selected');
            }
        }
        playerList.appendChild(playerItem);
    }

    teamDiv.appendChild(playerList);
    if (teamIndex === 0 || teamIndex === 1) {
        const redistributeButton = createRedistributeButton(teamIndex);
        teamDiv.appendChild(redistributeButton);
    }

    return teamDiv;
}


function renderTeams() {
    teamsContainer.innerHTML = '';
    teams = teams.filter(team => team.players.some(player => player));

    if (teams.length > 0) {
        const playingTeamsContainer = document.createElement('div');
        playingTeamsContainer.classList.add('playing-teams');

        const team1Div = createTeamElement(teams[0], 'Time 1', 0);
        const team2Div = teams.length > 1 ? createTeamElement(teams[1], 'Time 2', 1) : null;

        playingTeamsContainer.appendChild(team1Div);

        const vsDiv = document.createElement('div');
        vsDiv.classList.add('versus');
        playingTeamsContainer.appendChild(vsDiv);

        if (team2Div) {
            playingTeamsContainer.appendChild(team2Div);
        }

        teamsContainer.appendChild(playingTeamsContainer);
    }

    for (let i = 2; i < teams.length; i++) {
        const teamTitle = `${i - 1}º Próxima`;
        const teamDiv = createTeamElement(teams[i], teamTitle);
        teamsContainer.appendChild(teamDiv);
    }
}

function reRender (test) {
    const allPlayers = test.flatMap(team => team.players);

    teams = [];

    allPlayers.forEach(player => {
        addPlayerToTeam(player);
    });

    renderTeams();
    saveTeamsToFirestore();
}

document.getElementById('clearTeams').addEventListener('click', clearTeams);

function clearTeams() {
    const confirmClear = confirm('Deseja limpar os times?');
    if (confirmClear) {
        teams = []
        renderTeams();
        saveTeamsToFirestore();
    }
}

if (localStorage.getItem("isAdmin") !== "true") {
    window.location.href = "index.html";
}
