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
        teams: teamsData,
        teamOnHold: teamOnHold ? {
            players: teamOnHold.players.map(player => player ? {
                name: player.name,
                isSetter: player.isSetter,
                isFemale: player.isFemale,
                wins: player.wins || 0
            } : null),
            wins: teamOnHold.wins || 0
        } : null
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

function selectedPlayer(player, playerElement) {
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