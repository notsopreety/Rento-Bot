const fs = require('fs');
const path = require('path');
const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const flagsPath = path.join(__dirname, 'assets', 'json', 'flags.json');
let countries = [];

function loadCountries() {
    try {
        const data = fs.readFileSync(flagsPath, 'utf8');
        countries = JSON.parse(data).filter(c => c.flags && c.name?.common);
    } catch (error) {
        console.error('[GUESSFLAG] Failed to load flags:', error.message);
        countries = [];
    }
}

module.exports = {
    config: {
        name: "guessflag",
        version: "1.0",
        author: "Samir",
        description: {
            en: "Guess the country from its flag and win coins!",
            ne: "झण्डाबाट देश अनुमान लगाउनुहोस् र सिक्का जित्नुहोस्!"
        },
        category: "fun",
        slash: true
    },

    langs: {
        en: {
            correct: "You earned **$250** coins! 🎉",
            incorrect: "The correct answer was: **%1**",
            error: "❌ Failed to load flags",
            notYourGame: "❌ This game is not for you!",
            timeout: "⏰ Time's up! The correct answer was: **%1**"
        },
        ne: {
            correct: "तपाईंले **$250** सिक्का कमाउनुभयो! 🎉",
            incorrect: "सही उत्तर थियो: **%1**",
            error: "❌ झण्डा लोड गर्न असफल",
            notYourGame: "❌ यो खेल तपाईंको लागि होइन!",
            timeout: "⏰ समय सकियो! सही उत्तर थियो: **%1**"
        }
    },

    onLoad: loadCountries,

    onStart: async ({ message, interaction, usersData, userData, getLang }) => {
        try {
            if (interaction && !interaction.deferred && !interaction.replied)
                await interaction.deferReply();

            if (!countries.length) loadCountries();

            if (!countries.length) {
                const msg = getLang('error');
                return message ? message.reply(msg) : interaction.editReply(msg);
            }

            const userId = message ? message.author.id : interaction.user.id;
            await sendFlagGame(message, interaction, userId, usersData, userData, getLang);
        } catch (error) {
            console.error('[GUESSFLAG] Error:', error);
            const msg = getLang('error');
            if (interaction?.deferred) return interaction.editReply(msg);
            return message ? message.reply(msg) : interaction.reply({ content: msg, ephemeral: true });
        }
    }
};

async function sendFlagGame(message, interaction, userId, usersData, userData, getLang) {
    const correctCountry = countries[Math.floor(Math.random() * countries.length)];
    const correctAnswer = correctCountry.name.common;
    const flagUrl = correctCountry.flags.find(u => u.includes('.png')) || correctCountry.flags[0];

    const wrongAnswers = [];
    while (wrongAnswers.length < 3) {
        const random = countries[Math.floor(Math.random() * countries.length)];
        if (random.name.common !== correctAnswer && !wrongAnswers.includes(random.name.common))
            wrongAnswers.push(random.name.common);
    }

    const options = shuffleArray([correctAnswer, ...wrongAnswers]).map(country =>
        new StringSelectMenuOptionBuilder().setLabel(country).setValue(country)
    );

    const selectMenuId = `guessflag_${userId}_${Date.now()}`;
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(selectMenuId)
        .setPlaceholder('🏳️ Select the country...')
        .addOptions(options);

    const embed = new EmbedBuilder()
        .setTitle('🏳️ Guess the Flag!')
        .setDescription('Which country does this flag belong to?')
        .setImage(flagUrl)
        .setColor(0x5865F2)
        .setFooter({ text: 'You have 30 seconds to answer' });

    const sentMessage = message
        ? await message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] })
        : await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });

    const selectHandler = async (selectInteraction) => {
        if (selectInteraction.user.id !== userId)
            return selectInteraction.reply({ content: getLang('notYourGame'), ephemeral: true });

        await selectInteraction.deferUpdate();
        global.RentoBot.onSelectMenu.delete(selectMenuId);

        const selected = selectInteraction.values[0];
        const isCorrect = selected === correctAnswer;
        const color = isCorrect ? 0x57F287 : 0xED4245;
        const desc = isCorrect ? getLang('correct') : getLang('incorrect', correctAnswer);

        if (isCorrect) {
            const current = await usersData.get(userId);
            await usersData.set(userId, { money: current.money + 250 });
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle(isCorrect ? '✅ Correct!' : '❌ Wrong!')
            .setDescription(desc)
            .setImage(flagUrl)
            .setColor(color)
            .setFooter({ text: `Correct answer: ${correctAnswer}` });

        const playAgainId = `guessflag_playagain_${userId}_${Date.now()}`;
        const playAgainBtn = new ButtonBuilder()
            .setCustomId(playAgainId)
            .setLabel('🔄 Play Again')
            .setStyle(ButtonStyle.Success);

        await selectInteraction.editReply({
            embeds: [resultEmbed],
            components: [new ActionRowBuilder().addComponents(playAgainBtn)]
        });

        global.RentoBot.onButton.set(playAgainId, async (btn) => {
            if (btn.user.id !== userId)
                return btn.reply({ content: getLang('notYourGame'), ephemeral: true });
            await btn.deferUpdate();
            global.RentoBot.onButton.delete(playAgainId);
            await sendFlagGame(null, btn, userId, usersData, userData, getLang);
        });

        setTimeout(() => global.RentoBot.onButton.delete(playAgainId), 300000);
    };

    global.RentoBot.onSelectMenu.set(selectMenuId, selectHandler);

    setTimeout(async () => {
        if (!global.RentoBot.onSelectMenu.has(selectMenuId)) return;
        global.RentoBot.onSelectMenu.delete(selectMenuId);

        const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Time\'s Up!')
            .setDescription(getLang('timeout', correctAnswer))
            .setImage(flagUrl)
            .setColor(0x95A5A6)
            .setFooter({ text: `Correct answer: ${correctAnswer}` });

        const playAgainId = `guessflag_playagain_${userId}_${Date.now()}`;
        const playAgainBtn = new ButtonBuilder()
            .setCustomId(playAgainId)
            .setLabel('🔄 Play Again')
            .setStyle(ButtonStyle.Success);

        try {
            await sentMessage.edit({
                embeds: [timeoutEmbed],
                components: [new ActionRowBuilder().addComponents(playAgainBtn)]
            });

            global.RentoBot.onButton.set(playAgainId, async (btn) => {
                if (btn.user.id !== userId)
                    return btn.reply({ content: getLang('notYourGame'), ephemeral: true });
                await btn.deferUpdate();
                global.RentoBot.onButton.delete(playAgainId);
                await sendFlagGame(null, btn, userId, usersData, userData, getLang);
            });

            setTimeout(() => global.RentoBot.onButton.delete(playAgainId), 300000);
        } catch (err) {
            console.error('[GUESSFLAG] Timeout update failed:', err.message);
        }
    }, 30000);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
