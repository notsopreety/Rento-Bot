const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    config: {
        name: "meme",
        version: "1.0",
        author: "Samir",
        description: {
            en: "Get a random meme from Reddit",
            ne: "Reddit बाट अनियमित meme प्राप्त गर्नुहोस्"
        },
        category: "fun",
        slash: true
    },

    langs: {
        en: {
            error: "❌ An error occurred while fetching the meme: %1",
            nsfwWarning: "⚠️ This meme is marked as NSFW",
            spoilerWarning: "⚠️ This meme contains spoilers",
            notYourButton: "❌ This button is not for you!"
        },
        ne: {
            error: "❌ Meme प्राप्त गर्दा त्रुटि देखा पर्यो: %1",
            nsfwWarning: "⚠️ यो meme NSFW को रूपमा चिन्ह लगाइएको छ",
            spoilerWarning: "⚠️ यो meme मा spoilers छन्",
            notYourButton: "❌ यो बटन तपाईंको लागि होइन!"
        }
    },

    onStart: async ({ message, interaction, getLang }) => {
        try {
            if (interaction && !interaction.deferred && !interaction.replied)
                await interaction.deferReply();

            const userId = message ? message.author.id : interaction.user.id;
            await sendMeme(message, interaction, userId, getLang);

        } catch (error) {
            const msg = getLang('error', error.message || 'Unknown error');
            if (interaction?.deferred) return interaction.editReply(msg);
            return message ? message.reply(msg) : interaction.reply({ content: msg, ephemeral: true });
        }
    }
};

async function fetchMeme() {
    const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
    if (!data?.url) throw new Error('Invalid response from API');
    return data;
}

function createMemeEmbed(memeData, getLang) {
    const embed = new EmbedBuilder()
        .setTitle(`${memeData.title || 'Random Meme'}`)
        .setDescription(
            `**Subreddit:** r/${memeData.subreddit || 'unknown'}\n` +
            `**Author:** u/${memeData.author || 'unknown'}\n` +
            `**Upvotes:** ⬆️ ${memeData.ups || 0}`
        )
        .setImage(memeData.url)
        .setColor(0xFF6B6B)
        .setURL(memeData.postLink || memeData.url)
        .setFooter({
            text: memeData.nsfw ? '⚠️ NSFW Content' : 'Click the title to view on Reddit',
            iconURL: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png'
        })
        .setTimestamp();

    if (memeData.nsfw)
        embed.addFields({ name: '⚠️ Content Warning', value: getLang('nsfwWarning') });
    if (memeData.spoiler)
        embed.addFields({ name: '⚠️ Spoiler Warning', value: getLang('spoilerWarning') });

    return embed;
}

async function sendMeme(message, interaction, userId, getLang) {
    try {
        const meme = await fetchMeme();
        const embed = createMemeEmbed(meme, getLang);
        const buttonId = `meme_${userId}_${Date.now()}`;

        const button = new ButtonBuilder()
            .setCustomId(buttonId)
            .setLabel('🎲 Another Meme')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);
        const reply = { embeds: [embed], components: [row] };

        const sentMsg = message
            ? await message.reply(reply)
            : await interaction.editReply(reply);

        const handler = async (btn) => {
            if (btn.user.id !== userId)
                return btn.reply({ content: getLang('notYourButton'), ephemeral: true });
            await btn.deferUpdate();

            try {
                const newMeme = await fetchMeme();
                const newEmbed = createMemeEmbed(newMeme, getLang);
                const newId = `meme_${userId}_${Date.now()}`;

                const newButton = new ButtonBuilder()
                    .setCustomId(newId)
                    .setLabel('🎲 Another Meme')
                    .setStyle(ButtonStyle.Primary);

                await btn.editReply({
                    embeds: [newEmbed],
                    components: [new ActionRowBuilder().addComponents(newButton)]
                });

                global.RentoBot.onButton.delete(buttonId);
                global.RentoBot.onButton.set(newId, handler);
                setTimeout(() => global.RentoBot.onButton.delete(newId), 300000);
            } catch (e) {
                const errEmbed = new EmbedBuilder()
                    .setDescription(getLang('error', e.message || 'Unknown error'))
                    .setColor(0xED4245);
                await btn.editReply({ embeds: [errEmbed], components: [] });
                global.RentoBot.onButton.delete(buttonId);
            }
        };

        global.RentoBot.onButton.set(buttonId, handler);
        setTimeout(() => global.RentoBot.onButton.delete(buttonId), 300000);

    } catch (err) {
        const msg = getLang('error', err.message || 'Unknown error');
        if (interaction?.deferred) return interaction.editReply(msg);
        return message ? message.reply(msg) : interaction.reply({ content: msg, ephemeral: true });
    }
}
