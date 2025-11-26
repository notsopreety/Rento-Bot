
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const CATEGORIES = {
    waifu: { tag: "waifu", nsfw: false, description: "Waifu images" },
    maid: { tag: "maid", nsfw: false, description: "Maid images" },
    marin_kitagawa: { tag: "marin-kitagawa", nsfw: false, description: "Marin Kitagawa" },
    mori_calliope: { tag: "mori-calliope", nsfw: false, description: "Mori Calliope" },
    raiden_shogun: { tag: "raiden-shogun", nsfw: false, description: "Raiden Shogun" },
    oppai: { tag: "oppai", nsfw: true, description: "Oppai (NSFW)" },
    selfies: { tag: "selfies", nsfw: true, description: "Selfies (NSFW)" },
    uniform: { tag: "uniform", nsfw: true, description: "Uniform (NSFW)" },
    ass: { tag: "ass", nsfw: true, description: "Ass (NSFW)" },
    hentai: { tag: "hentai", nsfw: true, description: "Hentai (NSFW)" },
    milf: { tag: "milf", nsfw: true, description: "Milf (NSFW)" },
    oral: { tag: "oral", nsfw: true, description: "Oral (NSFW)" },
    paizuri: { tag: "paizuri", nsfw: true, description: "Paizuri (NSFW)" },
    ecchi: { tag: "ecchi", nsfw: true, description: "Ecchi (NSFW)" },
    ero: { tag: "ero", nsfw: true, description: "Ero (NSFW)" }
};

module.exports = {
    config: {
        name: "waifu",
        aliases: ["wf"],
        version: "1.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Get random waifu images from waifu.im",
            ne: "waifu.im बाट अनियमित waifu छविहरू प्राप्त गर्नुहोस्"
        },
        category: "anime",
        guide: {
            en: "{prefix}waifu [category] - Get waifu images\nCategories: " + Object.keys(CATEGORIES).join(", "),
            ne: "{prefix}waifu [category] - waifu छविहरू प्राप्त गर्नुहोस्\nश्रेणीहरू: " + Object.keys(CATEGORIES).join(", ")
        },
        slash: true,
        options: [
            {
                name: "category",
                description: "Image category",
                type: 3,
                required: false,
                choices: Object.entries(CATEGORIES).map(([key, val]) => ({
                    name: val.description,
                    value: key
                }))
            }
        ]
    },

    langs: {
        en: {
            loading: "🔍 Fetching waifu images...",
            error: "❌ Failed to fetch images. Please try again later.",
            nsfwNotAllowed: "🔞 NSFW content is disabled in this server! Use `/nsfw on` to enable it.",
            nsfwDMWarning: "⚠️ **NSFW Content Warning**\nThe following images contain adult content.",
            noImages: "❌ No images found for this category.",
            invalidCategory: "❌ Invalid category! Available: " + Object.keys(CATEGORIES).join(", "),
            imageCount: "Showing {count} images",
            reload: "🔄 Reload",
            delete: "🗑️ Delete",
            category: "Category",
            deleted: "✅ Images deleted successfully!"
        },
        ne: {
            loading: "🔍 waifu छविहरू ल्याइँदै...",
            error: "❌ छविहरू प्राप्त गर्न असफल भयो। पछि पुन: प्रयास गर्नुहोस्।",
            nsfwNotAllowed: "🔞 यो सर्भरमा NSFW सामग्री अक्षम छ! सक्षम गर्न `/nsfw on` प्रयोग गर्नुहोस्।",
            nsfwDMWarning: "⚠️ **NSFW सामग्री चेतावनी**\nनिम्न छविहरूमा वयस्क सामग्री छ।",
            noImages: "❌ यो श्रेणीको लागि कुनै छविहरू फेला परेन।",
            invalidCategory: "❌ अवैध श्रेणी! उपलब्ध: " + Object.keys(CATEGORIES).join(", "),
            imageCount: "{count} छविहरू देखाइँदै",
            reload: "🔄 पुन: लोड गर्नुहोस्",
            delete: "🗑️ मेटाउनुहोस्",
            category: "श्रेणी",
            deleted: "✅ छविहरू सफलतापूर्वक मेटाइयो!"
        }
    },

    onStart: async ({ message, interaction, args, guildData, guildsData, getLang }) => {
        const isInteraction = !!interaction;
        const isDM = isInteraction ? !interaction.guildId : !message.guildId;
        
        let category = isInteraction ? interaction.options.getString("category") || "waifu" : args[0]?.toLowerCase() || "waifu";
        
        if (!CATEGORIES[category]) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(getLang("invalidCategory"));
            return isInteraction ? interaction.reply({ embeds: [embed], flags: [4096] }) : message.reply({ embeds: [embed] });
        }

        const categoryInfo = CATEGORIES[category];
        
        if (categoryInfo.nsfw && !isDM) {
            const currentGuildData = await guildsData.get(guildData.guildID);
            const nsfwEnabled = currentGuildData?.settings?.nsfwEnabled || false;
            if (!nsfwEnabled) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(getLang("nsfwNotAllowed"));
                return isInteraction ? interaction.reply({ embeds: [embed], flags: [4096] }) : message.reply({ embeds: [embed] });
            }
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setDescription(getLang("loading"));

        const loadingMsg = isInteraction 
            ? await interaction.reply({ embeds: [loadingEmbed], fetchReply: true })
            : await message.reply({ embeds: [loadingEmbed] });

        try {
            const response = await axios.get(`https://www.waifu.im/search/?included_tags=${categoryInfo.tag}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const html = response.data;
            const match = html.match(/var files = (\[.*?\])/s);
            
            if (!match || !match[1]) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(getLang("noImages"));
                return isInteraction ? interaction.editReply({ embeds: [errorEmbed] }) : loadingMsg.edit({ embeds: [errorEmbed] });
            }

            const files = JSON.parse(match[1]);
            
            if (files.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription(getLang("noImages"));
                return isInteraction ? interaction.editReply({ embeds: [errorEmbed] }) : loadingMsg.edit({ embeds: [errorEmbed] });
            }

            const embeds = files.slice(0, 10).map((url, index) => {
                const embed = new EmbedBuilder()
                    .setColor(categoryInfo.nsfw ? 0xff69b4 : 0x00d9ff)
                    .setImage(url)
                    .setFooter({ text: `${getLang("category")}: ${categoryInfo.description} | ${index + 1}/${Math.min(files.length, 10)}` })
                    .setTimestamp();

                if (categoryInfo.nsfw && isDM) {
                    embed.setDescription(getLang("nsfwDMWarning"));
                }

                return embed;
            });

            const reloadButton = new ButtonBuilder()
                .setCustomId(`waifu_reload_${category}`)
                .setLabel(getLang("reload"))
                .setStyle(ButtonStyle.Primary)
                .setEmoji("🔄");

            const deleteButton = new ButtonBuilder()
                .setCustomId(`waifu_delete_${category}`)
                .setLabel(getLang("delete"))
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🗑️");

            const row = new ActionRowBuilder().addComponents(reloadButton, deleteButton);

            const replyOptions = { embeds, components: [row] };
            
            if (isInteraction) {
                await interaction.editReply(replyOptions);
            } else {
                await loadingMsg.edit(replyOptions);
            }

            const collector = (isInteraction ? loadingMsg : loadingMsg).createMessageComponentCollector({
                filter: i => i.customId.startsWith('waifu_reload_') || i.customId.startsWith('waifu_delete_'),
                time: 300000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== (isInteraction ? interaction.user.id : message.author.id)) {
                    return i.reply({ content: "❌ This is not your command!", ephemeral: true });
                }

                if (i.customId.startsWith('waifu_delete_')) {
                    const deleteEmbed = new EmbedBuilder()
                        .setColor(0x00ff00)
                        .setDescription(getLang("deleted"));
                    
                    await i.update({ embeds: [deleteEmbed], components: [] });
                    collector.stop();
                    return;
                }

                await i.deferUpdate();

                try {
                    const newResponse = await axios.get(`https://www.waifu.im/search/?included_tags=${categoryInfo.tag}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    const newHtml = newResponse.data;
                    const newMatch = newHtml.match(/var files = (\[.*?\])/s);
                    
                    if (newMatch && newMatch[1]) {
                        const newFiles = JSON.parse(newMatch[1]);
                        
                        const newEmbeds = newFiles.slice(0, 10).map((url, index) => {
                            const embed = new EmbedBuilder()
                                .setColor(categoryInfo.nsfw ? 0xff69b4 : 0x00d9ff)
                                .setImage(url)
                                .setFooter({ text: `${getLang("category")}: ${categoryInfo.description} | ${index + 1}/${Math.min(newFiles.length, 10)}` })
                                .setTimestamp();

                            if (categoryInfo.nsfw && isDM) {
                                embed.setDescription(getLang("nsfwDMWarning"));
                            }

                            return embed;
                        });

                        await i.editReply({ embeds: newEmbeds, components: [row] });
                    }
                } catch (error) {
                    console.error("Error reloading waifu images:", error);
                }
            });

        } catch (error) {
            console.error("Error fetching waifu images:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(getLang("error"));
            return isInteraction ? interaction.editReply({ embeds: [errorEmbed] }) : loadingMsg.edit({ embeds: [errorEmbed] });
        }
    }
};
