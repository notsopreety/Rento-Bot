
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const axios = require('axios');

const BASE_URL = 'https://henapi-mauve.vercel.app/api';

module.exports = {
    config: {
        name: "hentai",
        aliases: ["h", "hen"],
        version: "2.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Search and watch hentai videos from HenAPI",
            ne: "HenAPI बाट hentai भिडियोहरू खोज्नुहोस् र हेर्नुहोस्"
        },
        category: "anime",
        guide: {
            en: "{prefix}hentai - Get latest videos\n{prefix}hentai <search query> - Search for videos",
            ne: "{prefix}hentai - नवीनतम भिडियोहरू प्राप्त गर्नुहोस्\n{prefix}hentai <खोज> - भिडियोहरू खोज्नुहोस्"
        },
        slash: true,
        options: [
            {
                name: "action",
                description: "Action to perform",
                type: 3,
                required: false,
                choices: [
                    { name: "Latest Videos", value: "latest" },
                    { name: "Search Videos", value: "search" }
                ]
            },
            {
                name: "query",
                description: "Search query",
                type: 3,
                required: false
            },
            {
                name: "page",
                description: "Page number (default: 1)",
                type: 4,
                required: false
            }
        ]
    },

    langs: {
        en: {
            loading: "🔍 Fetching content...",
            error: "❌ Failed to fetch content: %1",
            nsfwNotAllowed: "🔞 NSFW is disabled! Use `/nsfw on` to enable in this server.",
            nsfwDMWarning: "⚠️ **NSFW Content Warning - 18+ Only**",
            noResults: "❌ No results found.",
            deleted: "✅ Deleted!",
            invalidChoice: "❌ This is not your menu!",
            timeout: "⏱️ Menu timed out. Please use the command again.",
            searchResults: "🔍 Search Results for: **%1**",
            latestVideos: "🆕 Latest Hentai Videos",
            videoDetails: "📹 Video Details",
            page: "Page %1 of %2",
            views: "👁️ %1",
            addedAt: "📅 %1",
            tags: "🏷️ %1",
            selectVideo: "Select a video to view details"
        },
        ne: {
            loading: "🔍 सामग्री ल्याइँदै...",
            error: "❌ सामग्री प्राप्त गर्न असफल: %1",
            nsfwNotAllowed: "🔞 NSFW अक्षम छ! यो सर्भरमा सक्षम गर्न `/nsfw on` प्रयोग गर्नुहोस्।",
            nsfwDMWarning: "⚠️ **NSFW सामग्री चेतावनी - 18+ मात्र**",
            noResults: "❌ परिणामहरू फेला परेन।",
            deleted: "✅ मेटाइयो!",
            invalidChoice: "❌ तपाईंको मेनु होइन!",
            timeout: "⏱️ मेनु समय समाप्त भयो। कृपया फेरि प्रयास गर्नुहोस्।",
            searchResults: "🔍 खोज परिणामहरू: **%1**",
            latestVideos: "🆕 नवीनतम Hentai भिडियोहरू",
            videoDetails: "📹 भिडियो विवरण",
            page: "पृष्ठ %1 को %2",
            views: "👁️ %1",
            addedAt: "📅 %1",
            tags: "🏷️ %1",
            selectVideo: "विवरण हेर्न भिडियो चयन गर्नुहोस्"
        }
    },

    onStart: async function ({ message, interaction, args, guildData, guildsData, getLang }) {
        const isSlash = !!interaction;
        const isDM = isSlash ? !interaction.guildId : !message.guildId;
        const userId = isSlash ? interaction.user.id : message.author.id;
        const user = isSlash ? interaction.user : message.author;

        // Check NSFW in guild
        if (!isDM) {
            const gd = await guildsData.get(guildData.guildID);
            if (!gd?.settings?.nsfwEnabled) {
                return this.sendError(message, interaction, getLang("nsfwNotAllowed"), isSlash);
            }
        }

        let action = 'latest';
        let query = '';
        let page = 1;

        // Parse arguments
        if (isSlash) {
            action = interaction.options.getString("action") || 'latest';
            query = interaction.options.getString("query") || '';
            page = interaction.options.getInteger("page") || 1;
        } else {
            if (args.length > 0) {
                action = 'search';
                query = args.join(' ');
            }
        }

        // Send loading
        const loading = new EmbedBuilder()
            .setColor(0xFF1493)
            .setDescription(getLang("loading"));
        
        let sentMessage = await this.sendMessage(message, interaction, { embeds: [loading] }, isSlash);

        // Fetch and display
        await this.displayContent(sentMessage, action, query, page, isDM, getLang, userId, user, isSlash);
    },

    displayContent: async function (sentMessage, action, query, page, isDM, getLang, userId, user, isSlash) {
        try {
            let url;
            let titleKey;

            if (action === 'search' && query) {
                url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;
                titleKey = 'searchResults';
            } else {
                url = `${BASE_URL}/latest?page=${page}`;
                titleKey = 'latestVideos';
            }

            const res = await axios.get(url, { timeout: 10000 });
            const data = res.data;

            if (!data.data || data.data.length === 0) {
                return this.updateMessage(sentMessage, {
                    embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(getLang("noResults"))],
                    components: []
                }, isSlash);
            }

            await this.showVideoList(data.data, data.currentPage, data.totalPage, sentMessage, getLang, user, action, query, isSlash);

        } catch (err) {
            console.error("Hentai error:", err);
            return this.updateMessage(sentMessage, {
                embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(getLang("error", err.message || 'Unknown error'))],
                components: []
            }, isSlash);
        }
    },

    showVideoList: async function (videoList, currentPage, totalPage, sentMessage, getLang, user, action, query, isSlash) {
        const options = videoList.slice(0, 25).map((video, index) => {
            const title = video.title.substring(0, 80) + (video.title.length > 80 ? '...' : '');
            const description = `${video.views} | ${video.addedAt}`;
            
            return new StringSelectMenuOptionBuilder()
                .setLabel(title)
                .setDescription(description.substring(0, 100))
                .setValue(`${index}`)
                .setEmoji('🎬');
        });

        const menuId = `hentai_select_${Date.now()}_${user.id}`;
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(menuId)
            .setPlaceholder(getLang("selectVideo"))
            .addOptions(options);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const components = [row1];

        const videoListText = videoList.slice(0, 15)
            .map((v, i) => {
                return `**${i + 1}.** ${v.title}\n${getLang("views", v.views)} | ${getLang("addedAt", v.addedAt)}`;
            })
            .join('\n\n');

        const title = action === 'search' && query ? getLang("searchResults", query) : getLang("latestVideos");
        
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(videoListText + `\n\n**${getLang("page", currentPage, totalPage)}**\n\n*Select from the menu below to view full details!*`)
            .setColor(0xFF1493)
            .setFooter({ text: `${user.username} | Menu timeout: 5 minutes`, iconURL: user.displayAvatarURL() })
            .setTimestamp();

        if (videoList[0]?.image && videoList[0].image !== 'https://tube.hentaistream.com/wp-content/themes/hentaistream_theme_2012/images/no-post-image.jpg') {
            embed.setImage(videoList[0].image);
        }

        // Add pagination buttons if multiple pages
        if (totalPage > 1) {
            const pageButtons = new ActionRowBuilder();
            
            if (currentPage > 1) {
                pageButtons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`hentai_page_${action}_${currentPage - 1}_${query}`)
                        .setLabel('◀️ Previous')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            if (currentPage < totalPage) {
                pageButtons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`hentai_page_${action}_${currentPage + 1}_${query}`)
                        .setLabel('Next ▶️')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            if (pageButtons.components.length > 0) {
                components.push(pageButtons);
            }
        }

        // Add delete button
        const controlButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`hentai_delete_${user.id}`)
                .setLabel('🗑️ Delete')
                .setStyle(ButtonStyle.Danger)
        );
        components.push(controlButtons);

        await this.updateMessage(sentMessage, { embeds: [embed], components }, isSlash);

        // Setup select menu handler
        global.RentoBot.onSelectMenu.set(menuId, async (selectInteraction) => {
            if (selectInteraction.user.id !== user.id) {
                return selectInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
            }

            const selectedIndex = parseInt(selectInteraction.values[0]);
            const selectedVideo = videoList[selectedIndex];

            await selectInteraction.deferUpdate();
            global.RentoBot.onSelectMenu.delete(menuId);

            await this.fetchAndDisplayVideo(sentMessage, selectedVideo.id, getLang, user, isSlash);
        });

        setTimeout(() => {
            global.RentoBot.onSelectMenu.delete(menuId);
        }, 300000);
    },

    fetchAndDisplayVideo: async function (sentMessage, videoId, getLang, user, isSlash) {
        try {
            const url = `${BASE_URL}/video/${videoId}`;
            const res = await axios.get(url, { timeout: 10000 });
            const video = res.data;

            if (!video.videoUrl) {
                return this.updateMessage(sentMessage, {
                    embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(getLang("noResults"))],
                    components: []
                }, isSlash);
            }

            const description = video.description 
                ? video.description.replace(/<[^>]*>/g, '').substring(0, 800) + '...'
                : 'No description available.';

            const embed = new EmbedBuilder()
                .setColor(0xFF1493)
                .setTitle(getLang("videoDetails"))
                .setDescription([
                    description,
                    '',
                    video.views ? getLang("views", video.views) : '',
                    video.addedAt ? getLang("addedAt", video.addedAt) : '',
                    video.tags && video.tags.length > 0 ? getLang("tags", video.tags.join(', ')) : '',
                    video.genres && video.genres.length > 0 ? `📂 **Genres:** ${video.genres.join(', ')}` : ''
                ].filter(Boolean).join('\n'))
                .setFooter({ text: `Video ID: ${videoId} | ${user.username}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            const deleteButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`hentai_delete_${user.id}`)
                    .setLabel('🗑️ Delete')
                    .setStyle(ButtonStyle.Danger)
            );

            // Send video link separately for preview
            const videoMessage = `🎬 **Watch Now:**\n${video.videoUrl}`;

            await this.updateMessage(sentMessage, { 
                content: videoMessage,
                embeds: [embed], 
                components: [deleteButton] 
            }, isSlash);

        } catch (err) {
            console.error("Hentai video error:", err);
            return this.updateMessage(sentMessage, {
                embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(getLang("error", err.message || 'Unknown error'))],
                components: []
            }, isSlash);
        }
    },

    onButton: async function ({ interaction, getLang }) {
        const customIdParts = interaction.customId.split('_');
        const action = customIdParts[1];
        const userId = interaction.user.id;

        if (action === 'delete') {
            const authorizedUserId = customIdParts[2];
            if (userId !== authorizedUserId) {
                return interaction.reply({ content: getLang("invalidChoice"), ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setDescription(getLang("deleted"));
            await interaction.update({ content: null, embeds: [embed], components: [] });
        } else if (action === 'page') {
            await interaction.deferUpdate();
            const [, , type, newPage, ...queryParts] = customIdParts;
            const query = queryParts.join('_');
            const page = parseInt(newPage);
            const isDM = !interaction.guildId;
            await this.displayContent({ interaction, isSlash: true }, type, query, page, isDM, getLang, userId, interaction.user, true);
        }
    },

    sendMessage: async function (message, interaction, content, isSlash) {
        if (isSlash) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(content);
                return { interaction, isSlash: true };
            } else {
                await interaction.reply(content);
                return { interaction, isSlash: true };
            }
        } else {
            const sent = await message.reply(content);
            return { message: sent, isSlash: false };
        }
    },

    updateMessage: async function (sentMessage, content, isSlash) {
        if (isSlash) {
            await sentMessage.interaction.editReply(content);
        } else {
            await sentMessage.message.edit(content);
        }
    },

    sendError: function (message, interaction, errorText, isSlash) {
        const errorEmbed = new EmbedBuilder()
            .setDescription(errorText)
            .setColor(0xED4245);

        if (isSlash) {
            if (interaction.replied || interaction.deferred) {
                return interaction.editReply({ embeds: [errorEmbed], components: [] });
            } else {
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } else {
            return message.reply({ embeds: [errorEmbed] });
        }
    }
};
