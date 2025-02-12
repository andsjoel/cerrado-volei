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

const teamsContainer = document.getElementById('teamsContainer');

function renderTeamsFromFirestore(teamsData) {
    teamsContainer.innerHTML = '';

    if (!teamsData || teamsData.length === 0) {
        const waitDiv = document.createElement('div');
        waitDiv.classList.add('waitDiv');
        const waitingMessage = document.createElement('h2');
        waitingMessage.textContent = "Esperando pelo primeiro jogador";
        waitingMessage.classList.add('blink')
        waitDiv.appendChild(waitingMessage);
        teamsContainer.appendChild(waitDiv);

        return;
    }

    teamsData.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.classList.add('team');

        const teamTitle = document.createElement('h3');
        teamTitle.textContent = `Time ${index + 1}`;
        teamDiv.appendChild(teamTitle);

        if (index === 2) {
            teamTitle.textContent = `1º Próxima`;
        }
        if (index === 3) {
            teamTitle.textContent = `2º Próxima`;
        }
        if (index === 4) {
            teamTitle.textContent = `3º Próxima`;
        }
        if (index === 5) {
            teamTitle.textContent = `5º Próxima`;
        }

        const playerList = document.createElement('ul');

        for (let i = 0; i < 6; i++) {
            const playerItem = document.createElement('div');
            playerItem.classList.add('player-space');
    
            if (team.players[i]) {
                const player = team.players[i];
                const playerName = `${player.name}`;
                const tagP = document.createElement('p');
                tagP.textContent = playerName;
                const playerWins = document.createElement('span');
                playerWins.textContent = `${player.wins}`
    
                playerItem.appendChild(tagP);
                playerItem.appendChild(playerWins)
    
                if (player.isSetter) playerItem.classList.add('player-setter');
                if (player.isFemale) playerItem.classList.add('player-female');
                playerItem.addEventListener('click', function (event) {
                    event.stopPropagation();
                    selectPlayer(player, playerItem);
                });
            } else {
                playerItem.textContent = 'ʕ•́ᴥ•̀ʔっ';
                playerItem.classList.add('player-empty');
                playerItem.addEventListener('click', function (event) {
                    event.stopPropagation();
                    selectEmptySpace(playerItem, teams.indexOf(team), i);
                });
            }
            playerList.appendChild(playerItem);
        }
        teamDiv.appendChild(playerList);
        teamsContainer.appendChild(teamDiv);
    });
}

db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        const teamsData = data.teams;
        renderTeamsFromFirestore(teamsData);
    } else {
        console.log("No teams data found!");
    }
});

const correctPassword = "admvolei2025";

document.getElementById("admBtn").addEventListener("click", function() {
    const inputPass = document.getElementById("admPass").value;

    if (inputPass === correctPassword) {
        localStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html";
    } else {
        alert("Senha incorreta!");
    }
});
