import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyA1O3YGQV1Up0n-wYXn34NyzMx0RT7NOL0",
    authDomain: "parads-list.firebaseapp.com",
    projectId: "parads-list",
    storageBucket: "parads-list.appspot.com",
    messagingSenderId: "502581426851",
    appId: "1:502581426851:web:9374424441ce1bddc71d16"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let teams = [];
let selectedPlayer = null;
let selectedEmptySpace = null;
let countWin = 0;

const playerForm = document.getElementById('playerForm');
const teamsContainer = document.getElementById('teams');
const removePlayerBtn = document.getElementById('removePlayerBtn');

db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        teams = data.teams;
        
        // Renderizar a lista de times na página
        renderTeams();
        // saveTeamsToFirestore();
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

    db.collection('teams').doc('currentTeams').set({
        teams: teamsData
    })
    .then(() => {
        console.log("Teams saved successfully!");
    })
    .catch(error => {
        console.error("Error saving teams: ", error);
    });
}

function handleWin(winningTeamIndex) {
    const winningTeam = teams[winningTeamIndex];

    winningTeam.wins = (winningTeam.wins || 0) + 1;

    const losingTeamIndex = winningTeamIndex === 0 ? 1 : 0;
    const losingTeam = teams[losingTeamIndex];
    redistributeLosingTeam(losingTeam);

    renderTeams();
    saveTeamsToFirestore();
}

function selectPlayer(player, playerElement) {
    // Se já houver um jogador selecionado
    if (selectedPlayer) {
        if (selectedPlayer.player === player) {
            return;
        }

        const confirmSwap = confirm(`Deseja trocar ${selectedPlayer.player.name} por ${player.name}?`);
        if (confirmSwap) {
            swapPlayers(selectedPlayer.player, player);
        }

        selectedPlayer.element.classList.remove('player-selected');
        selectedPlayer = null;

        renderTeams();
        return;
    }

    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    }

    selectedPlayer = { player: player, element: playerElement };
    playerElement.classList.add('player-selected');

    document.getElementById('removePlayerBtn').style.display = 'block';
}

function swapPlayers(playerA, playerB) {
    // Encontrar os times e índices dos jogadores
    const teamAIndex = teams.findIndex(team => team.players.includes(playerA));
    const teamBIndex = teams.findIndex(team => team.players.includes(playerB));

    const playerAIndex = teams[teamAIndex].players.indexOf(playerA);
    const playerBIndex = teams[teamBIndex].players.indexOf(playerB);

    // Trocar os jogadores
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
}

function addPlayerToTeam(player) {
    player.wins = player.wins || 0;

    if (selectedEmptySpace) {
        // Adicionar o jogador ao espaço vazio selecionado
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
    saveTeamsToFirestore();
}

function canAddPlayerToTeam(team, player) {
    const isSetterInTeam = team.players.some(p => p && p.isSetter);
    const isFemaleInTeam = team.players.some(p => p && p.isFemale);

    const teamNotFull = team.players.length < 6;

    // Regras para adicionar um jogador:
    // - O time deve ter menos de 6 jogadores
    // - Só pode ter um levantador e uma mulher no time
    if (!teamNotFull) return false;
    if (player.isSetter && isSetterInTeam) return false;
    if (player.isFemale && isFemaleInTeam) return false;

    return true;
}

document.getElementById('removePlayerBtn').addEventListener('click', function () {
    if (selectedPlayer) {
        // Encontrar o time e remover o jogador
        for (let team of teams) {
            const playerIndex = team.players.indexOf(selectedPlayer.player);
            if (playerIndex !== -1) {
                team.players.splice(playerIndex, 1);
                break;
            }
        }

        // Limpar seleção e esconder botão de remover
        selectedPlayer = null;
        this.style.display = 'none';

        // Re-renderizar os times
        renderTeams();
        saveTeamsToFirestore();
    }
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

    // Limpar formulário
    playerForm.reset();
    saveTeamsToFirestore();
});

document.addEventListener('click', function () {
    // Desmarcar jogador selecionado
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('player-selected');
        selectedPlayer = null;
    }

    // Desmarcar espaço vazio selecionado
    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    }

    // Esconder o botão de remover se nenhum jogador estiver selecionado
    document.getElementById('removePlayerBtn').style.display = 'none';
});

function redistributeLosingTeam(losingTeam) {
    let remainingPlayers = []; // Armazena os 4 jogadores não levantadores nem mulheres
    let setter = null; // Levantador do time
    let femalePlayer = null; // Mulher do time

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

    // Realocar o levantador
    if (setter) {
        realocatePlayer(setter);
    }

    // Realocar a mulher
    if (femalePlayer) {
        realocatePlayer(femalePlayer);
    }

    // Embaralhar os 4 jogadores restantes
    remainingPlayers = shuffleArray(remainingPlayers);

    // Realocar os jogadores restantes aleatoriamente
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

    // Se não encontrar time, cria um novo time
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

function createWinButton(teamIndex) {
    const winButton = document.createElement('button');
    winButton.textContent = 'Venceu';
    winButton.classList.add('win-button');
    winButton.addEventListener('click', function () {
        handleWin(teamIndex);
    });
    return winButton;
}

function createTeamElement(team, title, teamIndex = null) {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('team');

    const teamTitle = document.createElement('h3');
    teamTitle.textContent = title;
    teamDiv.appendChild(teamTitle);

    const playerList = document.createElement('div');
    playerList.style.display = 'flex';
    playerList.style.flexDirection = 'column';

    for (let i = 0; i < 6; i++) {
        const playerItem = document.createElement('div');
        playerItem.classList.add('player-space');

        if (team.players[i]) {
            const player = team.players[i];
            playerItem.textContent = `${player.name} ${player.wins || 0}`; // Exibe o número de vitórias
            if (player.isSetter) playerItem.classList.add('player-setter');
            if (player.isFemale) playerItem.classList.add('player-female');
            playerItem.addEventListener('click', function (event) {
                event.stopPropagation();
                selectPlayer(player, playerItem);
            });
        } else {
            playerItem.textContent = '?';
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
        const winButton = createWinButton(teamIndex);
        teamDiv.appendChild(winButton);
    }

    return teamDiv;
}

function renderTeams() {
    // console.log('Render Teams:', teams);
    teamsContainer.innerHTML = ''; // Limpa o container de times

    // Remover times vazios (com 0 jogadores)
    teams = teams.filter(team => team.players.some(player => player));

    // Verificar se há pelo menos dois times
    if (teams.length > 0) {
        // Cria uma seção especial para os dois primeiros times (Time 1 e Time 2)
        const playingTeamsContainer = document.createElement('div');
        playingTeamsContainer.classList.add('playing-teams');

        const team1Div = createTeamElement(teams[0], 'Time 1', 0);
        const team2Div = teams.length > 1 ? createTeamElement(teams[1], 'Time 2', 1) : null;

        playingTeamsContainer.appendChild(team1Div);

        // Adicionar o "X" entre os dois times
        const vsDiv = document.createElement('div');
        vsDiv.classList.add('versus');
        vsDiv.textContent = 'X';
        playingTeamsContainer.appendChild(vsDiv);

        if (team2Div) {
            playingTeamsContainer.appendChild(team2Div);
        }

        teamsContainer.appendChild(playingTeamsContainer);
    }

    // Renderiza os outros times, se existirem
    for (let i = 2; i < teams.length; i++) {
        const teamTitle = `${i - 1}º Próxima`;
        const teamDiv = createTeamElement(teams[i], teamTitle);
        teamsContainer.appendChild(teamDiv);
    }
}

function clearTeams() {
    const confirmClear = confirm('Deseja limpar os times?');
    if (confirmClear) {
        teams = []
        renderTeams();
        teamOnHold = null;
        saveTeamsToFirestore();
    }
}

if (localStorage.getItem("isAdmin") !== "true") {
    window.location.href = "index.html";
}