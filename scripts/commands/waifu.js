
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const SFW_TYPES = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
const NSFW_TYPES = ['waifu', 'neko', 'trap', 'blowjob'];

module.exports = {
    config: {
        name: "waifu",
        aliases: ["wf"],
        version: "3.1",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Get random waifu images from waifu.pics",
            ne: "waifu.pics बाट अनियमित waifu छविहरू प्राप्त गर्नुहोस्"
        },
        category: "anime",
        guide: {
            en: "{prefix}waifu - Random SFW waifu\n{prefix}waifu <sfw|nsfw> - Random from category\n{prefix}waifu <sfw|nsfw> <type> - Specific type\n\n**SFW Types:** " + SFW_TYPES.join(', ') + "\n**NSFW Types:** " + NSFW_TYPES.join(', '),
            ne: "{prefix}waifu - अनियमित SFW waifu \n{prefix}waifu <sfw|nsfw> - श्रेणीबाट अनियमित \n{prefix}waifu <sfw|nsfw> <type> - विशिष्ट प्रकार\n\n**SFW प्रकारहरू:** " + SFW_TYPES.join(', ') + "\n**NSFW प्रकारहरू:** " + NSFW_TYPES.join(', ')
        },
        slash: true,
        options: [
            {
                name: "category",
                description: "Image category (SFW or NSFW)",
                type: 3,
                required: false,
                choices: [
                    { name: "SFW", value: "sfw" },
                    { name: "NSFW (18+)", value: "nsfw" }
                ]
            },
            {
                name: "type",
                description: "Specific image type",
                type: 3,
                required: false,
                choices: [
                    ...SFW_TYPES.slice(0, 20).map(t => ({ name: t, value: `sfw_${t}` })),
                    ...NSFW_TYPES.map(t => ({ name: `${t} [NSFW]`, value: `nsfw_${t}` }))
                ]
            }
        ]
    },

    langs: {
        en: {
            loading: "🔍 Fetching images...",
            error: "❌ Failed to fetch images.",
            nsfwNotAllowed: "🔞 NSFW is disabled! Use `/nsfw on` to enable.",
            nsfwDMWarning: "⚠️ **NSFW Content Warning**",
            noImages: "❌ No images found.",
            invalidType: "❌ Invalid type!",
            invalidCategory: "❌ Invalid category! Use `sfw` or `nsfw`.",
            deleted: "✅ Deleted!",
            notYours: "❌ Not your command!"
        },
        ne: {
            loading: "🔍 छविहरू ल्याइँदै...",
            error: "❌ छविहरू प्राप्त गर्न असफल।",
            nsfwNotAllowed: "🔞 NSFW अक्षम छ!",
            nsfwDMWarning: "⚠️ **NSFW सामग्री चेतावनी**",
            noImages: "❌ छविहरू फेला परेन।",
            invalidType: "❌ अवैध प्रकार!",
            invalidCategory: "❌ अवैध श्रेणी!",
            deleted: "✅ मेटाइयो!",
            notYours: "❌ तपाईंको आदेश होइन!"
        }
    },

    onStart: async ({ message, interaction, args, guildData, guildsData, getLang }) => {
        const isSlash = !!interaction;
        const isDM = isSlash ? !interaction.guildId : !message.guildId;
        const userId = isSlash ? interaction.user.id : message.author.id;

        let category = 'sfw';
        let type = 'waifu';

        // Parse options
        if (isSlash) {
            const typeOpt = interaction.options.getString("type");
            const catOpt = interaction.options.getString("category");

            if (typeOpt) {
                [category, type] = typeOpt.split('_');
            } else if (catOpt) {
                category = catOpt;
                const types = category === 'sfw' ? SFW_TYPES : NSFW_TYPES;
                type = types[Math.floor(Math.random() * types.length)];
            }
        } else {
            if (args[0]) {
                const arg = args[0].toLowerCase();
                if (['sfw', 'nsfw'].includes(arg)) {
                    category = arg;
                    type = args[1]?.toLowerCase() || (category === 'sfw' ? SFW_TYPES : NSFW_TYPES)[Math.floor(Math.random() * (category === 'sfw' ? SFW_TYPES.length : NSFW_TYPES.length))];
                } else {
                    type = arg;
                    category = NSFW_TYPES.includes(type) ? 'nsfw' : 'sfw';
                }
            }
        }

        // Validate
        const validTypes = category === 'sfw' ? SFW_TYPES : NSFW_TYPES;
        if (!['sfw', 'nsfw'].includes(category)) {
            return reply(isSlash, interaction, message, getLang("invalidCategory"), true);
        }
        if (!validTypes.includes(type)) {
            return reply(isSlash, interaction, message, getLang("invalidType"), true);
        }

        // Check NSFW in guild
        if (category === 'nsfw' && !isDM) {
            const gd = await guildsData.get(guildData.guildID);
            if (!gd?.settings?.nsfwEnabled) {
                return reply(isSlash, interaction, message, getLang("nsfwNotAllowed"), true);
            }
        }

        // Send loading
        const loading = new EmbedBuilder().setColor(0x3498db).setDescription(getLang("loading"));
        const msg = isSlash ? await interaction.reply({ embeds: [loading], fetchReply: true }) : await message.reply({ embeds: [loading] });

        // Fetch and display
        await displayImages(msg, category, type, isDM, getLang, userId, isSlash);
    },

    onButton: async ({ interaction, getLang }) => {
        const [, action, category, type] = interaction.customId.split('_');
        const userId = interaction.user.id;

        if (action === 'delete') {
            const embed = new EmbedBuilder().setColor(0x00ff00).setDescription(getLang("deleted"));
            await interaction.update({ embeds: [embed], components: [] });
        } else if (action === 'reload') {
            await interaction.deferUpdate();
            const isDM = !interaction.guildId;
            await displayImages(interaction.message, category, type, isDM, getLang, userId, false);
        }
    }
};

async function reply(isSlash, interaction, message, text, ephemeral = false) {
    const embed = new EmbedBuilder().setColor(0xff0000).setDescription(text);
    const opts = { embeds: [embed] };
    if (ephemeral && isSlash) opts.flags = [4096];
    return isSlash ? interaction.reply(opts) : message.reply(opts);
}

async function displayImages(msg, category, type, isDM, getLang, userId, isSlash) {
    try {
        const res = await axios.post(`https://api.waifu.pics/many/${category}/${type}`, { exclude: [] }, {
            headers: { 'content-type': 'application/json' },
            timeout: 10000
        });

        const files = res.data?.files || [];
        if (!files.length) {
            const embed = new EmbedBuilder().setColor(0xff0000).setDescription(getLang("noImages"));
            return msg.edit({ embeds: [embed] });
        }

        const embeds = files.slice(0, 10).map((url, i) => {
            const e = new EmbedBuilder()
                .setColor(category === 'nsfw' ? 0xff1493 : 0x00d9ff)
                .setImage(url)
                .setFooter({ text: `${type.toUpperCase()} (${category.toUpperCase()}) | ${i + 1}/${Math.min(files.length, 10)}` })
                .setTimestamp();
            if (category === 'nsfw' && isDM) e.setDescription(getLang("nsfwDMWarning"));
            return e;
        });

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`waifu_reload_${category}_${type}`).setLabel('🔄 Reload').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`waifu_delete_${category}_${type}`).setLabel('🗑️ Delete').setStyle(ButtonStyle.Danger)
        );

        await msg.edit({ embeds, components: [buttons] });

    } catch (err) {
        console.error("Waifu error:", err);
        const embed = new EmbedBuilder().setColor(0xff0000).setDescription(getLang("error"));
        await msg.edit({ embeds: [embed] }).catch(() => {});
    }
}