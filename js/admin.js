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
let countWin = 0;
let teamOnHold = null;
let backupUndo = [];

const playerForm = document.getElementById('playerForm');
const teamsContainer = document.getElementById('teams');
const returningTeamContainer = document.getElementById('returningTeam') //Div para exibir o time que volta
// const removePlayerBtn = document.getElementById('removePlayerBtn');
const admBtn = document.getElementById('admBtn');
const undoBtn = document.getElementById('undo-btn');
const twoWoman = document.getElementById("cb5");


db.collection('teams').doc('currentTeams').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        teams = data.teams;
        teamOnHold = data.teamOnHold;

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

    // Criar um backup antes de salvar
    db.collection('teams').doc('currentTeams').get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                backupUndo = data.teams // Armazena o backup dos dados antigos
                // console.log("Backup criado:", backupUndo);
            }

            // Salvar os novos times no Firestore
            return db.collection('teams').doc('currentTeams').set({ teams: teamsData, isRuleActive: isRuleActive });
        })
        .then(() => {
            console.log("Teams saved successfully!");
            // document.getElementById("undo-btn").style.display = "block"; // Mostrar botão de desfazer
        })
        .catch(error => {
            console.error("Error saving teams: ", error);
        });
}

twoWoman.addEventListener('click', saveTeamsToFirestore);

undoBtn.addEventListener('click', function () {
    console.log('undo:', backupUndo);
    console.log('teams:', teams);

    reRender(backupUndo);
});

function handleWin(winningTeamIndex) {
    const winningTeam = teams[winningTeamIndex];
    console.log(winningTeam);

    const confirmRedistribute = confirm(`Deseja Redistribuir o time de ${winningTeam.players[0].name}?`)

    if(confirmRedistribute) {
        redistributeLosingTeam(winningTeam);
        teams.splice(winningTeamIndex, 1);
    }

    renderTeams();
    saveTeamsToFirestore();
}

function handleWinPlayer (winningTeamIndex) {
    const winningTeam = teams[winningTeamIndex];
    winningTeam.wins = (winningTeam.wins || 0) + 1;

    winningTeam.players.forEach(player => {
        if (player) {
            player.wins = (player.wins || 0) + 1; // Incrementa vitórias do jogador
        }
    });

    renderTeams();
    saveTeamsToFirestore();
}

function selectPlayer(player, playerElement) {
    // Se já houver um jogador selecionado
    if (selectedPlayer) {
        // Se o jogador selecionado é o mesmo que o já selecionado, não faz nada
        if (selectedPlayer.player === player) {
            return;
        }

        // Pergunta de confirmação para trocar os jogadores
        const confirmSwap = confirm(`Deseja trocar ${selectedPlayer.player.name} por ${player.name}?`);
        if (confirmSwap) {
            swapPlayers(selectedPlayer.player, player);
        } else {
            selectedPlayer.element.classList.remove('player-selected');
            selectedPlayer = null;
        }

        // Desmarcar jogador selecionado após a confirmação
        
        // selectedPlayer = null;

        // Atualiza a interface
        return;
    }

    // Desmarcar espaço vazio, se houver
    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    }

    // Marcar o novo jogador como selecionado
    selectedPlayer = { player: player, element: playerElement };
    // console.log(playerElement);
    playerElement.classList.add('player-selected');

    // Exibir o botão de remover
    // document.getElementById('removePlayerBtn').style.display = 'block';
}

// Função para trocar jogadores
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

// Função para selecionar um espaço vazio
function selectEmptySpace(playerElement, teamIndex, playerIndex) {
    // Se já houver um espaço vazio selecionado, desmarcar
    if (selectedEmptySpace) {
        selectedEmptySpace.element.classList.remove('player-empty-selected');
    }

    // Desmarcar jogador, se houver
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('player-selected');
        selectedPlayer = null;
    }

    // Marcar o espaço vazio como selecionado
    selectedEmptySpace = { element: playerElement, teamIndex: teamIndex, playerIndex: playerIndex };
    playerElement.classList.add('player-empty-selected');

    renderTeams();
}

// Função para adicionar jogador ao time
function addPlayerToTeam(player) {
    player.wins = player.wins || 0;

    if (selectedEmptySpace) {
        // Adicionar o jogador ao espaço vazio selecionado
        const team = teams[selectedEmptySpace.teamIndex];
        team.players[selectedEmptySpace.playerIndex] = player;

        // Limpar a seleção de espaço vazio
        selectedEmptySpace.element.classList.remove('player-empty-selected');
        selectedEmptySpace = null;
    } else {
        // Adiciona o jogador a um time da forma normal (primeiro time com vaga)
        for (let team of teams) {
            if (canAddPlayerToTeam(team, player)) {
                team.players.push(player);
                return;
            }
        }

        // Se não encontrar time, cria um novo
        const newTeam = { players: [] };
        newTeam.players.push(player);
        teams.push(newTeam);
    }
    // saveTeamsToFirestore();
}

// Função para verificar se o jogador pode ser adicionado a um time
// function canAddPlayerToTeam(team, player) {
//     const isSetterInTeam = team.players.some(p => p && p.isSetter);
//     const isFemaleInTeam = team.players.some(p => p && p.isFemale);
//     const countFemaleInTeam = team.players.filter(p => p && p.isFemale).length;
//     console.log(countFemaleInTeam);
//     console.log(teams);

//     // console.log('VALUE', twoWoman.checked);

//     const teamNotFull = team.players.length < 6;


//     if (!teamNotFull) return false;
//     if (player.isSetter && isSetterInTeam) return false;
//     if (player.isFemale && twoWoman.checked && countFemaleInTeam >= 2) return false;
//     if (player.isFemale && isFemaleInTeam) return false;

//     return true;
// }

function canAddPlayerToTeam(team, player) {
    const isSetterInTeam = team.players.some(p => p && p.isSetter);
    const isFemaleInTeam = team.players.some(p => p && p.isFemale);
    const countFemaleInTeam = team.players.filter(p => p && p.isFemale).length;
    console.log(countFemaleInTeam);
    console.log(teams);

    const teamNotFull = team.players.length < 6;


    if (!teamNotFull) return false;
    if (!isSetterInTeam && team.players.length >= 5 && !player.isSetter) return false;
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

// Função para remover o jogador selecionado
// const deleteBtn = document.getElementById('removePlayerBtn');

// if (deleteBtn) {
//     deleteBtn.addEventListener('click', function () {
//         if (selectedPlayer) {
//             // Encontrar o time e remover o jogador
//             for (let team of teams) {
//                 const playerIndex = team.players.indexOf(selectedPlayer.player);
    
//                 if (playerIndex !== -1) {
//                     team.players.splice(playerIndex, 1);
//                     break;
//                 }
//             }
    
//             // Limpar seleção e esconder botão de remover
//             // selectedPlayer = null;
//             this.style.display = 'none';
    
//             reRender(teams);
    
//             // Re-renderizar os times
//             // renderTeams();
//             saveTeamsToFirestore();
//         }
//     });
// }

const deleteBtnShow = document.getElementById('removePlayerBtnShow');

if (deleteBtnShow) {
    deleteBtnShow.addEventListener('click', function () {
        console.log('aaa');
    });
}


// Função para adicionar jogador ao formulário
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

// Detecta cliques fora dos jogadores e espaços vazios para desmarcar seleção
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
    // document.getElementById('removePlayerBtnShow').style.display = 'none';
    // document.getElementById('removePlayerBtn').style.display = 'none';

    renderTeams();
});

// Função para redistribuir o time perdedor
function redistributeLosingTeam(losingTeam) {
    let remainingPlayers = []; // Armazena os 4 jogadores não levantadores nem mulheres
    let setter = null; // Levantador do time
    let femalePlayer = null; // Mulher do time

    losingTeam.wins = 0;

    // Classificar os jogadores do time
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

// Função para realocar um jogador em um time disponível
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

// Função auxiliar para embaralhar array (usado para os 4 jogadores restantes)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função auxiliar para criar botão de vitória
function createWinButton(teamIndex) {
    const winButton = document.createElement('button');
    winButton.textContent = 'Redistribuir Time';
    winButton.classList.add('win-button');
    winButton.addEventListener('click', function () {
        handleWin(teamIndex);
    });
    return winButton;
}

// function createWinPlayerButton() {
//     const winPlayer = document.createElement('button');
//     winPlayer.textContent = 'Venceu'
// };

// Atualização da função que cria a interface dos times
function createTeamElement(team, title, teamIndex = null) {
    const teamDiv = document.createElement('div');
    teamDiv.classList.add('team');

    teamDiv.addEventListener('click', function () {
        console.log('akieu', teamIndex);

        const optionTeam = document.createElement('div');
        optionTeam.classList.add('optionTeam');
        optionTeam.textContent = 'aaaaaa'

        teamDiv.appendChild(optionTeam);
    })

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

            const btnDelete = document.createElement('button');
            btnDelete.textContent = '✖'
            btnDelete.id = 'removePlayerBtn';
            // btnDelete.style.display = 'none'

            playerItem.appendChild(tagP);
            playerItem.appendChild(btnDelete);

            // playerList.appendChild(btnDelete);


            // playerItem.textContent = `${player.name}`;
            if (player.isSetter) playerItem.classList.add('player-setter');
            if (player.isFemale) playerItem.classList.add('player-female');
            playerItem.addEventListener('click', function (event) {
                event.stopPropagation();
                selectPlayer(player, playerItem);

                btnDelete.id = 'removePlayerBtnShow'
                btnDelete.addEventListener('click', function() {
                    if (selectedPlayer) {
                        // Encontrar o time e remover o jogador
                        for (let team of teams) {
                            const playerIndex = team.players.indexOf(selectedPlayer.player);
                            
                            if (playerIndex !== -1) {
                                team.players.splice(playerIndex, 1);
                                selectedPlayer = null;
                                break;
                            }
                        }
                
                        // Limpar seleção e esconder botão de remover
                        selectedPlayer = null;
                        this.style.display = 'none';
                
                        reRender(teams);
                
                        // Re-renderizar os times
                        // saveTeamsToFirestore();
                        setTimeout(() => {
                            selectedPlayer = null;
                        }, 100);
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
        const winButton = createWinButton(teamIndex);
        teamDiv.appendChild(winButton);
    }

    return teamDiv;
}


// Função para renderizar os times atualizada com os botões "Venceu"
function renderTeams() {
    teamsContainer.innerHTML = ''; // Limpa o container de times

    // Remover times vazios (com 0 jogadores)
    teams = teams.filter(team => team.players.some(player => player));

    if (teamOnHold) {
        const returningTeamDiv = createTeamElement(teamOnHold, 'Volta');
        returningTeamContainer.innerHTML = ''; // Limpa o container do time "Volta"
        returningTeamContainer.appendChild(returningTeamDiv);
    } else {
        returningTeamContainer.innerHTML = ''; // Limpa se não houver time em espera
    }

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

function reRender (test) {
    const allPlayers = test.flatMap(team => team.players);

    teams = [];

    allPlayers.forEach(player => {
        addPlayerToTeam(player);
    });

    renderTeams();
    saveTeamsToFirestore();
}

// Adicionando o evento para o botão de popular times
document.getElementById('clearTeams').addEventListener('click', clearTeams);
// document.getElementById('populateTeamsButton').addEventListener('click', populateTeams);


const mockPlayers = [
    // Levantadores
    { id: 1, name: "Pedrin", isSetter: true, isFemale: false, wins: 1 },
    { id: 2, name: "Ramon", isSetter: true, isFemale: false },
    { id: 3, name: "Lopes", isSetter: true, isFemale: false },
    { id: 4, name: "Luciano", isSetter: true, isFemale: false },

    // Mulheres
    { id: 5, name: "Yas", isSetter: false, isFemale: true },
    { id: 6, name: "Sabrina", isSetter: false, isFemale: true },
    { id: 7, name: "Gabi", isSetter: false, isFemale: true },
    { id: 8, name: "Nadhy", isSetter: false, isFemale: true },
    { id: 9, name: "Mari", isSetter: false, isFemale: true },

    // Jogadores
    { id: 11, name: "Dome", isSetter: false, isFemale: false },
    { id: 12, name: "Hax", isSetter: false, isFemale: false },
    { id: 13, name: "Juan", isSetter: false, isFemale: false },
    { id: 14, name: "Haylon", isSetter: false, isFemale: false },
    { id: 15, name: "Thi", isSetter: false, isFemale: false },
    { id: 16, name: "Kurati", isSetter: false, isFemale: false },
    { id: 16, name: "Antiono", isSetter: false, isFemale: false },
    { id: 16, name: "Pedro L", isSetter: false, isFemale: false },
    { id: 16, name: "Carlin", isSetter: false, isFemale: false },
    { id: 16, name: "Samuel", isSetter: false, isFemale: false },
    { id: 16, name: "Vitu", isSetter: false, isFemale: false },
    { id: 16, name: "Luis", isSetter: false, isFemale: false },
    { id: 16, name: "Icaro", isSetter: false, isFemale: false },
    { id: 16, name: "Moises", isSetter: false, isFemale: false },
    { id: 16, name: "Joao", isSetter: false, isFemale: false },
    { id: 16, name: "Edu", isSetter: false, isFemale: false },
    { id: 16, name: "Neto", isSetter: false, isFemale: false },
    { id: 16, name: "Paulo", isSetter: false, isFemale: false },
    { id: 16, name: "Tiago", isSetter: false, isFemale: false },

];


function populateTeams() {
    mockPlayers.forEach(player => {
        addPlayerToTeam(player);
    });
    renderTeams();
    saveTeamsToFirestore();
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


// ##########################

        // Verifica se o usuário está autenticado
        if (localStorage.getItem("isAdmin") !== "true") {
            // Se não estiver autenticado, redireciona para a página inicial
            window.location.href = "index.html";
        }


// const team = document.getElementById('team');

// if (team) {
//     team.addEventListener('click', function () {
//         console.log('time clicado');
//     })
// }