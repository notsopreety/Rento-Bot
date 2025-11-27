
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    config: {
        name: "tictactoe",
        aliases: ["ttt"],
        version: "2.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Play an enhanced Tic Tac Toe game with another user",
            ne: "अर्को प्रयोगकर्तासँग उन्नत टिक ट्याक टो खेल्नुहोस्"
        },
        category: "game",
        guide: {
            en: "{pn} @mention - Challenge a user to an epic Tic Tac Toe battle",
            ne: "{pn} @mention - महाकाव्य टिक ट्याक टो युद्धको लागि प्रयोगकर्तालाई चुनौती दिनुहोस्"
        },
        slash: true,
        options: [
            {
                name: "opponent",
                description: "The user you want to challenge",
                type: 6, // USER type
                required: true
            }
        ]
    },

    langs: {
        en: {
            noMention: "❌ Please mention a user to play with!",
            cantPlaySelf: "❌ You can't play with yourself! Find a worthy opponent!",
            cantPlayBot: "❌ You can't play with bots! Challenge a real player!",
            gameStarted: "⚔️ **EPIC TIC TAC TOE BATTLE** ⚔️\n\n**{player1}** ❌ vs **{player2}** ⭕\n\n{player1}, you're up first! Make your move!",
            yourTurn: "**{player}'s Turn** {symbol}",
            invalidMove: "❌ Invalid move! Please choose a number between 1-9 that's available on the board.",
            positionTaken: "⚠️ That position is already taken! Choose an empty spot.",
            notYourTurn: "⏸️ Hold on! It's not your turn yet. Wait for your opponent to move!",
            winner: "🏆 **VICTORY!** 🏆\n\n**{player}** {symbol} has conquered the board!\n\n**Game Stats:**\n⏱️ Duration: {duration}\n🎯 Total Moves: {moves}",
            draw: "🤝 **IT'S A DRAW!** 🤝\n\nBoth players fought valiantly!\n\n**Game Stats:**\n⏱️ Duration: {duration}\n🎯 Total Moves: 9",
            gameAbandoned: "⏰ Game abandoned - No response for 5 minutes!",
            moveHistory: "**Move History:**\n{history}"
        },
        ne: {
            noMention: "❌ कृपया खेल्नको लागि प्रयोगकर्तालाई उल्लेख गर्नुहोस्!",
            cantPlaySelf: "❌ तपाईं आफैसँग खेल्न सक्नुहुन्न! योग्य प्रतिद्वन्द्वी खोज्नुहोस्!",
            cantPlayBot: "❌ तपाईं बटसँग खेल्न सक्नुहुन्न! वास्तविक खेलाडीलाई चुनौती दिनुहोस्!",
            gameStarted: "⚔️ **महाकाव्य टिक ट्याक टो युद्ध** ⚔️\n\n**{player1}** ❌ बनाम **{player2}** ⭕\n\n{player1}, तपाईं पहिले हुनुहुन्छ! आफ्नो चाल बनाउनुहोस्!",
            yourTurn: "**{player} को पालो** {symbol}",
            invalidMove: "❌ अवैध चाल! कृपया बोर्डमा उपलब्ध 1-9 बीचको संख्या छान्नुहोस्।",
            positionTaken: "⚠️ त्यो स्थान पहिले नै लिइसकेको छ! खाली स्थान छान्नुहोस्।",
            notYourTurn: "⏸️ होल्ड गर्नुहोस्! यो अझै तपाईंको पालो होइन। आफ्नो प्रतिद्वन्द्वीलाई चाल दिन पर्खनुहोस्!",
            winner: "🏆 **विजय!** 🏆\n\n**{player}** {symbol} ले बोर्ड जितेको छ!\n\n**खेल तथ्याङ्क:**\n⏱️ अवधि: {duration}\n🎯 कुल चाल: {moves}",
            draw: "🤝 **बराबरी!** 🤝\n\nदुवै खेलाडीहरूले साहसपूर्वक लडे!\n\n**खेल तथ्याङ्क:**\n⏱️ अवधि: {duration}\n🎯 कुल चाल: 9",
            gameAbandoned: "⏰ खेल छोडियो - 5 मिनेटसम्म कुनै प्रतिक्रिया छैन!",
            moveHistory: "**चाल इतिहास:**\n{history}"
        }
    },

    onStart: async ({ message, interaction, args, getLang }) => {
        const isSlash = !!interaction;
        const player1 = isSlash ? interaction.user : message.author;
        
        let player2;
        if (isSlash) {
            player2 = interaction.options.getUser('opponent');
        } else {
            if (!message.mentions.users.size) {
                const response = getLang("noMention");
                return message.reply(response);
            }
            player2 = message.mentions.users.first();
        }

        if (!player2) {
            const response = getLang("noMention");
            return isSlash ? interaction.reply(response) : message.reply(response);
        }

        if (player2.id === player1.id) {
            const response = getLang("cantPlaySelf");
            return isSlash ? interaction.reply(response) : message.reply(response);
        }

        if (player2.bot) {
            const response = getLang("cantPlayBot");
            return isSlash ? interaction.reply(response) : message.reply(response);
        }

        const board = Array(9).fill(null);
        const gameState = {
            board,
            player1: { id: player1.id, username: player1.username, symbol: '❌', displaySymbol: 'X' },
            player2: { id: player2.id, username: player2.username, symbol: '⭕', displaySymbol: 'O' },
            currentPlayer: player1.id,
            moveCount: 0,
            moveHistory: [],
            startTime: Date.now()
        };

        const boardDisplay = formatBoard(board);
        const description = getLang("gameStarted")
            .replace(/{player1}/g, player1.username)
            .replace(/{player2}/g, player2.username);

        const embed = new EmbedBuilder()
            .setTitle("⚔️ TIC TAC TOE BATTLE ⚔️")
            .setDescription(`${description}\n\n${boardDisplay}`)
            .setColor(0xFF6B6B)
            .addFields(
                { name: '❌ Player 1', value: `${player1.username}\n**Symbol:** X`, inline: true },
                { name: '⭕ Player 2', value: `${player2.username}\n**Symbol:** O`, inline: true },
                { name: '📊 Game Stats', value: `**Moves:** 0/9\n**Current Turn:** ${player1.username}`, inline: true }
            )
            .setFooter({ text: "Reply with a number (1-9) to make your move • Game will timeout in 5 minutes" })
            .setTimestamp();

        let botMessage;
        if (isSlash) {
            botMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
        } else {
            botMessage = await message.reply({ embeds: [embed] });
        }

        global.RentoBot.onReply.set(botMessage.id, {
            commandName: "tictactoe",
            messageId: botMessage.id,
            author: player1.id,
            participants: [player1.id, player2.id],
            gameState,
            handler: createGameHandler(gameState, getLang, botMessage)
        });

        setTimeout(() => {
            if (global.RentoBot.onReply.has(botMessage.id)) {
                const timeoutEmbed = new EmbedBuilder()
                    .setDescription(getLang("gameAbandoned"))
                    .setColor(0x95A5A6);

                botMessage.edit({ embeds: [timeoutEmbed] }).catch(() => {});
                global.RentoBot.onReply.delete(botMessage.id);
            }
        }, 300000); // 5 minutes timeout
    },
};

function formatBoard(board, winPattern = null) {
    const emptySymbols = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    const display = [];
    
    for (let i = 0; i < 9; i += 3) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            const index = i + j;
            let cell = board[index] || emptySymbols[index];
            row.push(cell);
        }
        display.push(row.join(' '));
    }
    
    let boardStr = '```\n' + display.join('\n\n') + '\n```';
    
    // Add winning line indicator below the board
    if (winPattern) {
        const winType = 
            winPattern[0] === 0 && winPattern[1] === 1 ? '━━━ Row 1 Victory! ━━━' :
            winPattern[0] === 3 && winPattern[1] === 4 ? '━━━ Row 2 Victory! ━━━' :
            winPattern[0] === 6 && winPattern[1] === 7 ? '━━━ Row 3 Victory! ━━━' :
            winPattern[0] === 0 && winPattern[1] === 3 ? '┃ Col 1 Victory! ┃' :
            winPattern[0] === 1 && winPattern[1] === 4 ? '┃ Col 2 Victory! ┃' :
            winPattern[0] === 2 && winPattern[1] === 5 ? '┃ Col 3 Victory! ┃' :
            winPattern[0] === 0 && winPattern[1] === 4 ? '╲ Diagonal Victory! ╱' :
            '╱ Diagonal Victory! ╲';
        boardStr += `\n${winType}`;
    }
    
    return boardStr;
}

function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], pattern };
        }
    }

    return null;
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
}

function createGameHandler(gameState, getLang, botMessage) {
    return async ({ message: replyMsg }) => {
        const playerId = replyMsg.author.id;
        
        if (playerId !== gameState.player1.id && playerId !== gameState.player2.id) {
            return;
        }

        if (playerId !== gameState.currentPlayer) {
            const errorEmbed = new EmbedBuilder()
                .setDescription(getLang("notYourTurn"))
                .setColor(0xE74C3C);
            
            await replyMsg.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
            return;
        }

        const position = parseInt(replyMsg.content.trim());
        
        if (isNaN(position) || position < 1 || position > 9) {
            const errorEmbed = new EmbedBuilder()
                .setDescription(getLang("invalidMove"))
                .setColor(0xE74C3C);
            
            await replyMsg.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
            return;
        }

        const index = position - 1;
        
        if (gameState.board[index] !== null) {
            const errorEmbed = new EmbedBuilder()
                .setDescription(getLang("positionTaken"))
                .setColor(0xF39C12);
            
            await replyMsg.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
            setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
            return;
        }

        const currentPlayerData = playerId === gameState.player1.id ? gameState.player1 : gameState.player2;
        gameState.board[index] = currentPlayerData.symbol;
        gameState.moveCount++;
        
        // Add to move history
        gameState.moveHistory.push({
            player: currentPlayerData.username,
            position: position,
            symbol: currentPlayerData.displaySymbol
        });

        // Delete the reply message for cleaner chat
        setTimeout(() => replyMsg.delete().catch(() => {}), 500);

        const winResult = checkWinner(gameState.board);
        const duration = formatDuration(Date.now() - gameState.startTime);

        if (winResult) {
            const boardDisplay = formatBoard(gameState.board, winResult.pattern);
            const winnerName = currentPlayerData.username;
            const description = getLang("winner")
                .replace(/{player}/g, winnerName)
                .replace(/{symbol}/g, currentPlayerData.symbol)
                .replace(/{duration}/g, duration)
                .replace(/{moves}/g, gameState.moveCount);
            
            // Format move history
            const moveHistory = gameState.moveHistory.map((move, i) => 
                `${i + 1}. ${move.player} → Position ${move.position} (${move.symbol})`
            ).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle("🏆 GAME OVER - VICTORY! 🏆")
                .setDescription(`${description}\n\n${boardDisplay}`)
                .addFields(
                    { name: '📜 Move History', value: moveHistory, inline: false }
                )
                .setColor(0x2ECC71)
                .setFooter({ text: `Congratulations ${winnerName}! 🎉` })
                .setTimestamp();

            await botMessage.edit({ embeds: [embed] }).catch(() => {});
            global.RentoBot.onReply.delete(botMessage.id);
            return;
        }

        if (gameState.moveCount === 9) {
            const boardDisplay = formatBoard(gameState.board);
            const description = getLang("draw")
                .replace(/{duration}/g, duration);
            
            // Format move history
            const moveHistory = gameState.moveHistory.map((move, i) => 
                `${i + 1}. ${move.player} → Position ${move.position} (${move.symbol})`
            ).join('\n');
            
            const embed = new EmbedBuilder()
                .setTitle("🤝 GAME OVER - DRAW! 🤝")
                .setDescription(`${description}\n\n${boardDisplay}`)
                .addFields(
                    { name: '📜 Move History', value: moveHistory, inline: false }
                )
                .setColor(0xF39C12)
                .setFooter({ text: "Well played by both players!" })
                .setTimestamp();

            await botMessage.edit({ embeds: [embed] }).catch(() => {});
            global.RentoBot.onReply.delete(botMessage.id);
            return;
        }

        gameState.currentPlayer = playerId === gameState.player1.id ? gameState.player2.id : gameState.player1.id;
        const nextPlayerData = gameState.currentPlayer === gameState.player1.id ? gameState.player1 : gameState.player2;
        
        const boardDisplay = formatBoard(gameState.board);
        const turnMessage = getLang("yourTurn")
            .replace(/{player}/g, nextPlayerData.username)
            .replace(/{symbol}/g, nextPlayerData.symbol);
        
        // Get last 3 moves for history preview
        const recentMoves = gameState.moveHistory.slice(-3).map((move, i) => 
            `${gameState.moveHistory.length - 2 + i}. ${move.player} → ${move.position} (${move.symbol})`
        ).join('\n');
        
        // Calculate current duration
        const currentDuration = formatDuration(Date.now() - gameState.startTime);
        
        const embed = new EmbedBuilder()
            .setTitle("⚔️ TIC TAC TOE BATTLE ⚔️")
            .setDescription(`${turnMessage}\n\n${boardDisplay}`)
            .setColor(gameState.currentPlayer === gameState.player1.id ? 0xFF6B6B : 0x4A90E2)
            .addFields(
                { name: '❌ Player 1', value: `${gameState.player1.username}\n**Symbol:** X`, inline: true },
                { name: '⭕ Player 2', value: `${gameState.player2.username}\n**Symbol:** O`, inline: true },
                { name: '📊 Game Stats', value: `**Moves:** ${gameState.moveCount}/9\n⏱️ **Time:** ${currentDuration}`, inline: true }
            )
            .setFooter({ text: `${nextPlayerData.username}, it's your turn! Reply with a number (1-9)` })
            .setTimestamp();

        if (recentMoves) {
            embed.addFields({ name: '📜 Recent Moves', value: recentMoves, inline: false });
        }

        await botMessage.edit({ embeds: [embed] }).catch(() => {});
    };
}
