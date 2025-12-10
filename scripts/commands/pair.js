const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: "pair",
        aliases: ["ship", "couple"],
        version: "4.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Pair yourself or a mentioned user with a random user",
            ne: "आफू वा उल्लेखित प्रयोगकर्तालाई अनियमित प्रयोगकर्तासँग जोडी बनाउनुहोस्"
        },
        category: "fun",
        guide: {
            en: "{prefix}pair [@user]",
            ne: "{prefix}pair [@user]"
        },
        slash: true,
        options: [
            {
                name: "user",
                description: "User you want to pair",
                type: 6,
                required: false
            }
        ]
    },

    langs: {
        en: {
            notEnoughUsers: "❌ Not enough users available to create a pair!",
            pairTitle: "💕 Perfect Match Found! 💕",
            compatibility: "Compatibility Score",
            footer: "Made with 💖 by RentoBot"
        },
        ne: {
            notEnoughUsers: "❌ जोडी बनाउन पर्याप्त प्रयोगकर्ताहरू छैनन्!",
            pairTitle: "💕 उत्तम मिलान भेटियो! 💕",
            compatibility: "मिलाप स्कोर",
            footer: "💖 द्वारा बनाइएको RentoBot"
        }
    },

    onStart: async ({ message, interaction, getLang }) => {
        const isSlash = !!interaction;
        const guild = isSlash ? interaction.guild : message.guild;

        // Get author or user from slash mention
        const executor =
            isSlash
                ? (interaction.options.getUser("user") || interaction.user)
                : (message.mentions.users.first() || message.author);

        try {
            await guild.members.fetch().catch(() => {});

            // Filter available members
            const members = guild.members.cache.filter(
                m => !m.user.bot && m.user.id !== executor.id
            );

            if (members.size === 0) {
                const msg = getLang("notEnoughUsers");
                return isSlash
                    ? interaction.reply({ content: msg, ephemeral: true })
                    : message.reply(msg);
            }

            const randomUser = members.random().user;

            // Deterministic compatibility
            const seed = executor.id + randomUser.id;
            let hash = 0;
            for (let ch of seed) {
                hash = ((hash << 5) - hash) + ch.charCodeAt(0);
                hash |= 0;
            }
            const compatibility = Math.abs(hash) % 101;

            const embed = new EmbedBuilder()
                .setTitle(getLang("pairTitle"))
                .setDescription(
                    `${getHeartEmoji(compatibility)} <@${executor.id}> × <@${randomUser.id}> ${getHeartEmoji(compatibility)}\n\n` +
                    getLoveMessage(compatibility)
                )
                .addFields({
                    name: `📊 ${getLang("compatibility")}`,
                    value: `${generateProgressBar(compatibility)} **${compatibility}%**`
                })
                .setColor(getColorByCompatibility(compatibility))
                .setThumbnail(executor.displayAvatarURL({ extension: 'png' }))
                .setImage(randomUser.displayAvatarURL({ extension: 'png' }))
                .setFooter({ text: getLang("footer"), iconURL: guild.iconURL() })
                .setTimestamp();

            return isSlash
                ? interaction.reply({ embeds: [embed] })
                : message.reply({ embeds: [embed] });

        } catch (err) {
            console.error("PAIR CMD ERR:", err);
            const errorMsg = "❌ Something went wrong!";
            return isSlash
                ? interaction.reply({ content: errorMsg, ephemeral: true })
                : message.reply(errorMsg);
        }
    }
};

function generateProgressBar(percentage) {
    const total = 15;
    const filled = Math.round((percentage / 100) * total);
    return "💖".repeat(filled) + "🤍".repeat(total - filled);
}

function getColorByCompatibility(p) {
    if (p >= 90) return 0xFF1493;
    if (p >= 75) return 0xFF69B4;
    if (p >= 60) return 0xFFB6C1;
    if (p >= 45) return 0xFFA500;
    if (p >= 30) return 0xFFD700;
    return 0x808080;
}

function getHeartEmoji(p) {
    if (p >= 90) return '💝';
    if (p >= 75) return '💖';
    if (p >= 60) return '💗';
    if (p >= 45) return '💓';
    if (p >= 30) return '💕';
    return '💔';
}

function getLoveMessage(p) {
    if (p >= 90) return "🌟 **Perfect Match!** Soulmates detected! ✨";
    if (p >= 75) return "✨ **Amazing Connection!** This could be real! 🌹";
    if (p >= 60) return "🌸 **Great Chemistry!** There’s a spark! 💫";
    if (p >= 45) return "🌼 **Good Potential!** Worth a try! 🎯";
    if (p >= 30) return "🍀 **Could Work!** Anything is possible! 💪";
    return "💭 **Just Friends** — but friendship is beautiful too! 🤝";
}
