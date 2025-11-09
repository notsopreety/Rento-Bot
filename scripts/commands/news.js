
const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment-timezone');

module.exports = {
    config: {
        name: "news",
        aliases: ["nepalnews", "np-news"],
        version: "1.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Get latest Nepali news from different categories",
            ne: "विभिन्न श्रेणीबाट पछिल्लो नेपाली समाचार प्राप्त गर्नुहोस्"
        },
        category: "news",
        guide: {
            en: "{prefix}news [category] - Get Nepali news\n\nCategories:\n• tops - ताजा खबर (Latest)\n• pltc - राजनीति (Politics)\n• sprt - खेलकुद (Sports)\n• scte - प्रविधि (Technology)\n• hlth - स्वास्थ्य (Health)\n• busi - अर्थ (Business)\n• entm - मनोरञ्जन (Entertainment)\n• wrld - विश्व (World)\n• ltre - साहित्य (Literature)\n• stat - प्रदेश समाचार (State)\n• oths - अन्य (Others)\n\nExample: {prefix}news tops",
            ne: "{prefix}news [श्रेणी] - नेपाली समाचार प्राप्त गर्नुहोस्"
        },
        slash: true,
        options: [
            {
                name: "category",
                description: "News category",
                type: 3,
                required: false,
                choices: [
                    { name: "🔥 ताजा खबर (Latest)", value: "tops" },
                    { name: "🏛️ राजनीति (Politics)", value: "pltc" },
                    { name: "⚽ खेलकुद (Sports)", value: "sprt" },
                    { name: "💻 प्रविधि (Technology)", value: "scte" },
                    { name: "🏥 स्वास्थ्य (Health)", value: "hlth" },
                    { name: "💰 अर्थ (Business)", value: "busi" },
                    { name: "🎬 मनोरञ्जन (Entertainment)", value: "entm" },
                    { name: "🌍 विश्व (World)", value: "wrld" },
                    { name: "📚 साहित्य (Literature)", value: "ltre" },
                    { name: "🏢 प्रदेश समाचार (State)", value: "stat" },
                    { name: "📰 अन्य (Others)", value: "oths" }
                ]
            }
        ]
    },

    langs: {
        en: {
            fetching: "🔍 Fetching latest Nepali news...",
            error: "❌ An error occurred while fetching news: %1",
            noNews: "❌ No news articles found for this category!",
            newsTitle: "📰 Nepali News - %1",
            selectNews: "**Found %1 news articles!**\n\nSelect an article from the dropdown below to read more:",
            timeout: "⏰ Time's up! News selection cancelled.",
            invalidChoice: "❌ This is not your selection!",
            loadingArticle: "⏳ Loading article...",
            readMore: "Read Full Article",
            page: "Page %1/%2",
            categoryNames: {
                tops: "🔥 ताजा खबर",
                pltc: "🏛️ राजनीति",
                sprt: "⚽ खेलकुद",
                scte: "💻 प्रविधि",
                hlth: "🏥 स्वास्थ्य",
                busi: "💰 अर्थ",
                entm: "🎬 मनोरञ्जन",
                wrld: "🌍 विश्व",
                ltre: "📚 साहित्य",
                stat: "🏢 प्रदेश समाचार",
                oths: "📰 अन्य"
            }
        },
        ne: {
            fetching: "🔍 पछिल्लो नेपाली समाचार ल्याउँदै...",
            error: "❌ समाचार ल्याउँदा त्रुटि देखा पर्यो: %1",
            noNews: "❌ यस श्रेणीमा कुनै समाचार लेखहरू फेला परेन!",
            newsTitle: "📰 नेपाली समाचार - %1",
            selectNews: "**%1 समाचार लेखहरू फेला पर्यो!**\n\nथप पढ्न तलको ड्रपडाउनबाट लेख चयन गर्नुहोस्:",
            timeout: "⏰ समय सकियो! समाचार चयन रद्द गरियो।",
            invalidChoice: "❌ यो तपाईंको छनोट होइन!",
            loadingArticle: "⏳ लेख लोड गर्दै...",
            readMore: "पूर्ण लेख पढ्नुहोस्",
            page: "पृष्ठ %1/%2",
            categoryNames: {
                tops: "🔥 ताजा खबर",
                pltc: "🏛️ राजनीति",
                sprt: "⚽ खेलकुद",
                scte: "💻 प्रविधि",
                hlth: "🏥 स्वास्थ्य",
                busi: "💰 अर्थ",
                entm: "🎬 मनोरञ्जन",
                wrld: "🌍 विश्व",
                ltre: "📚 साहित्य",
                stat: "🏢 प्रदेश समाचार",
                oths: "📰 अन्य"
            }
        }
    },

    onStart: async function ({ message, interaction, args, getLang }) {
        const isSlash = !!interaction;
        const user = isSlash ? interaction.user : message.author;

        try {
            let category = 'tops';
            
            if (isSlash) {
                category = interaction.options.getString('category') || 'tops';
            } else if (args[0]) {
                const validCategories = ['tops', 'pltc', 'sprt', 'scte', 'hlth', 'busi', 'entm', 'wrld', 'ltre', 'stat', 'oths'];
                category = validCategories.includes(args[0].toLowerCase()) ? args[0].toLowerCase() : 'tops';
            }

            const fetchingEmbed = new EmbedBuilder()
                .setDescription(getLang("fetching"))
                .setColor(0xDC143C)
                .setFooter({ text: user.username });

            let sentMessage;
            if (isSlash) {
                await interaction.reply({ embeds: [fetchingEmbed] });
                sentMessage = await interaction.fetchReply();
                sentMessage.isSlash = true;
                sentMessage.interaction = interaction;
            } else {
                sentMessage = await message.reply({ embeds: [fetchingEmbed] });
                sentMessage.isSlash = false;
            }

            const newsList = await fetchNepaliNews(category);

            if (!newsList || newsList.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setDescription(getLang("noNews"))
                    .setColor(0xED4245);
                
                if (isSlash) {
                    return interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    return sentMessage.edit({ embeds: [errorEmbed] });
                }
            }

            await showNewsPage(newsList, sentMessage, getLang, user, category, 0);

        } catch (error) {
            console.error('Nepali News command error:', error);
            const errorMsg = getLang("error", error.message || "Unknown error");
            const errorEmbed = new EmbedBuilder()
                .setDescription(errorMsg)
                .setColor(0xED4245);

            if (isSlash) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } else {
                await message.reply({ embeds: [errorEmbed] });
            }
        }
    }
};

async function fetchNepaliNews(category = 'tops') {
    const URL = `https://api-news.nepalipatro.com.np/api/feeds?lang=np&filter[category]=${category}`;
    
    try {
        const { data } = await axios.get(URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
        });

        if (!data.feeds || !Array.isArray(data.feeds)) {
            return [];
        }

        return data.feeds.slice(0, 10).map(feed => ({
            id: feed.id,
            title: feed.title,
            description: feed.description,
            content: feed.content,
            link: feed.link,
            source: feed.source,
            category: feed.category,
            author: feed.author || "Unknown",
            image: feed.image,
            pubDate: feed.pub_date,
            updateDate: feed.update_date
        }));
    } catch (error) {
        console.error('Error fetching Nepali news:', error);
        throw error;
    }
}

function formatDateTime(dateString) {
    try {
        const date = moment(dateString).tz('Asia/Kathmandu');
        return date.format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
        return dateString;
    }
}

async function showNewsPage(newsList, sentMessage, getLang, user, category, page) {
    const newsPerPage = 5;
    const totalPages = Math.ceil(newsList.length / newsPerPage);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    
    const startIdx = currentPage * newsPerPage;
    const endIdx = Math.min(startIdx + newsPerPage, newsList.length);
    const pageNews = newsList.slice(startIdx, endIdx);

    const categoryName = getLang("categoryNames")[category] || category;
    
    let description = getLang("selectNews", newsList.length) + "\n\n";
    
    pageNews.forEach((news, idx) => {
        const globalIdx = startIdx + idx;
        const truncatedDesc = news.description.length > 150 
            ? news.description.substring(0, 150) + '...' 
            : news.description;
        
        description += `**${globalIdx + 1}. ${news.title}**\n`;
        description += `${truncatedDesc}\n`;
        description += `📅 ${formatDateTime(news.pubDate)}\n\n`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`${getLang("newsTitle", categoryName)}`)
        .setDescription(description)
        .setColor(0xDC143C)
        .setFooter({ 
            text: `${user.username} | ${getLang("page", currentPage + 1, totalPages)} | Timeout: 5m` 
        })
        .setTimestamp();

    if (pageNews[0]?.image) {
        embed.setThumbnail(pageNews[0].image);
    }

    const options = pageNews.map((news, idx) => {
        const globalIdx = startIdx + idx;
        const title = news.title.substring(0, 90);
        const pubTime = formatDateTime(news.pubDate);
        
        return new StringSelectMenuOptionBuilder()
            .setLabel(`${globalIdx + 1}. ${title}${title.length >= 90 ? '...' : ''}`)
            .setDescription(`📅 ${pubTime}`)
            .setValue(`${globalIdx}`)
            .setEmoji('📰');
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`news_select_${sentMessage.id}`)
        .setPlaceholder('Select a news article to read')
        .addOptions(options);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    const buttonRow = new ActionRowBuilder();
    
    buttonRow.addComponents(
        new ButtonBuilder()
            .setCustomId(`news_back_${sentMessage.id}`)
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
        new ButtonBuilder()
            .setCustomId(`news_next_${sentMessage.id}`)
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
        new ButtonBuilder()
            .setLabel('Nepali Patro')
            .setURL('https://nepalipatro.com.np')
            .setStyle(ButtonStyle.Link)
            .setEmoji('🌐')
    );

    if (sentMessage.isSlash) {
        await sentMessage.interaction.editReply({ embeds: [embed], components: [selectRow, buttonRow] });
    } else {
        await sentMessage.edit({ embeds: [embed], components: [selectRow, buttonRow] });
    }

    const selectMenuId = `news_select_${sentMessage.id}`;
    global.RentoBot.onSelectMenu.set(selectMenuId, async (selectInteraction) => {
        if (selectInteraction.user.id !== user.id) {
            return selectInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
        }

        const selectedIdx = parseInt(selectInteraction.values[0]);
        const selectedNews = newsList[selectedIdx];
        
        await selectInteraction.deferUpdate();
        await showArticle(selectedNews, sentMessage, getLang, user, newsList, category);
    });

    const backButtonId = `news_back_${sentMessage.id}`;
    const nextButtonId = `news_next_${sentMessage.id}`;

    global.RentoBot.onButton.set(backButtonId, async (buttonInteraction) => {
        if (buttonInteraction.user.id !== user.id) {
            return buttonInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
        }

        await buttonInteraction.deferUpdate();
        global.RentoBot.onButton.delete(backButtonId);
        global.RentoBot.onButton.delete(nextButtonId);
        await showNewsPage(newsList, sentMessage, getLang, user, category, currentPage - 1);
    });

    global.RentoBot.onButton.set(nextButtonId, async (buttonInteraction) => {
        if (buttonInteraction.user.id !== user.id) {
            return buttonInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
        }

        await buttonInteraction.deferUpdate();
        global.RentoBot.onButton.delete(backButtonId);
        global.RentoBot.onButton.delete(nextButtonId);
        await showNewsPage(newsList, sentMessage, getLang, user, category, currentPage + 1);
    });

    setTimeout(() => {
        if (global.RentoBot.onSelectMenu.has(selectMenuId)) {
            const timeoutEmbed = new EmbedBuilder()
                .setDescription(getLang("timeout"))
                .setColor(0x95A5A6);

            if (sentMessage.isSlash) {
                sentMessage.interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            } else {
                sentMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
            global.RentoBot.onSelectMenu.delete(selectMenuId);
            global.RentoBot.onButton.delete(backButtonId);
            global.RentoBot.onButton.delete(nextButtonId);
        }
    }, 300000);
}

async function showArticle(newsItem, sentMessage, getLang, user, newsList, category) {
    try {
        const actualUrl = await getActualArticleUrl(newsItem.link);
        
        let content = newsItem.content || newsItem.description;
        const maxContentLength = 1800;
        
        if (content.length > maxContentLength) {
            content = content.substring(0, maxContentLength) + '...';
        }
        
        content += `\n\n[${getLang("readMore")}](${actualUrl})`;

        const embed = new EmbedBuilder()
            .setTitle(`📰 ${newsItem.title}`)
            .setDescription(content)
            .setColor(0xDC143C)
            .setURL(actualUrl)
            .addFields([
                { 
                    name: '📅 Published', 
                    value: formatDateTime(newsItem.pubDate), 
                    inline: true 
                },
                { 
                    name: '📝 Source', 
                    value: newsItem.source.toUpperCase(), 
                    inline: true 
                }
            ])
            .setFooter({ text: `Requested by ${user.username}` })
            .setTimestamp();

        if (newsItem.image) {
            embed.setImage(newsItem.image);
        }

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`news_back_to_list_${sentMessage.id}`)
                .setLabel('◀ Back to List')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📋'),
            new ButtonBuilder()
                .setLabel(getLang("readMore"))
                .setURL(actualUrl)
                .setStyle(ButtonStyle.Link)
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setLabel('Nepali Patro')
                .setURL('https://nepalipatro.com.np')
                .setStyle(ButtonStyle.Link)
                .setEmoji('🌐')
        );

        if (sentMessage.isSlash) {
            await sentMessage.interaction.editReply({ embeds: [embed], components: [buttonRow] });
        } else {
            await sentMessage.edit({ embeds: [embed], components: [buttonRow] });
        }

        const backButtonId = `news_back_to_list_${sentMessage.id}`;
        global.RentoBot.onButton.set(backButtonId, async (buttonInteraction) => {
            if (buttonInteraction.user.id !== user.id) {
                return buttonInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
            }

            await buttonInteraction.deferUpdate();
            global.RentoBot.onButton.delete(backButtonId);
            await showNewsPage(newsList, sentMessage, getLang, user, category, 0);
        });

    } catch (error) {
        console.error('Error showing article:', error);
    }
}

async function getActualArticleUrl(apiUrl) {
    try {
        const urlMatch = apiUrl.match(/url=(.+)$/);
        if (urlMatch && urlMatch[1]) {
            return decodeURIComponent(urlMatch[1]);
        }
        return apiUrl;
    } catch (error) {
        return apiUrl;
    }
}
