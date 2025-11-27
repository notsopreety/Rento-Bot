
const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

Canvas.registerFont(
    __dirname + "/assets/font/BeVietnamPro-SemiBold.ttf", {
    family: "BeVietnamPro-SemiBold"
});
Canvas.registerFont(
    __dirname + "/assets/font/BeVietnamPro-Regular.ttf", {
    family: "BeVietnamPro-Regular"
});
Canvas.registerFont(
    __dirname + "/assets/font/BeVietnamPro-Bold.ttf", {
    family: "BeVietnamPro-Bold"
});

const COLORS = {
    primary: '#00a8e8',
    secondary: '#007ea7',
    background: '#0d1117',
    cardBg: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    accent: '#667eea',
    accentDark: '#764ba2',
    success: '#238636',
    gold: '#ffd700',
    languages: ['#f1e05a', '#3178c6', '#e34c26', '#563d7c', '#b07219', '#178600', '#89e051', '#438eff', '#4F5D95', '#f34b7d', '#555555', '#00ADD8', '#dea584', '#cc342d', '#3572A5', '#DA5B0B'],
    editors: ['#007ACC', '#1EAEFF', '#F7DF1E', '#FF6B6B', '#4FC08D', '#61DAFB', '#FF7F50', '#9370DB'],
    os: ['#0078D4', '#FCC624', '#000000', '#A2AAAD', '#FF6B6B'],
    categories: ['#4ecdc4', '#ff6b6b', '#95e1d3', '#f38181', '#fce38a', '#eaffd0', '#a8e6cf', '#dfe6e9']
};

module.exports = {
    config: {
        name: "wakatime",
        aliases: ["waka", "codestats"],
        version: "2.0",
        author: "Samir",
        countDown: 10,
        role: 0,
        description: {
            en: "View detailed WakaTime coding statistics with interactive visualizations",
            ne: "अन्तरक्रियात्मक भिजुअलाइजेसन सहित विस्तृत WakaTime कोडिङ तथ्याङ्क हेर्नुहोस्"
        },
        category: "tools",
        guide: {
            en: "{prefix}wakatime <username>\nExample: {prefix}wakatime notsopreety",
            ne: "{prefix}wakatime <प्रयोगकर्तानाम>\nउदाहरण: {prefix}wakatime notsopreety"
        },
        slash: true,
        options: [
            {
                name: "username",
                description: "WakaTime username to lookup",
                type: 3,
                required: true
            }
        ]
    },

    langs: {
        en: {
            syntaxError: "Please provide a WakaTime username",
            fetching: "Fetching WakaTime data...",
            notFound: "User not found: **%1**\nMake sure the profile is public.",
            error: "An error occurred: %1",
            noStats: "No coding statistics available for this user yet.",
            profilePrivate: "This user's profile is private.",
            selectView: "Select a view from the dropdown below:",
            timeout: "Time's up! Selection cancelled.",
            invalidChoice: "This is not your selection!",
            statsCalculating: "Stats are being calculated. Please try again in a few minutes.",
            overview: "Overview",
            languages: "Languages",
            editors: "Editors & OS",
            categories: "Categories",
            timeline: "Timeline"
        },
        ne: {
            syntaxError: "कृपया WakaTime प्रयोगकर्तानाम प्रदान गर्नुहोस्",
            fetching: "WakaTime डाटा लोड हुँदैछ...",
            notFound: "प्रयोगकर्ता फेला परेन: **%1**\nप्रोफाइल सार्वजनिक छ भने जाँच गर्नुहोस्।",
            error: "त्रुटि देखा पर्यो: %1",
            noStats: "यो प्रयोगकर्ताको लागि अहिलेसम्म कोडिङ तथ्याङ्क उपलब्ध छैन।",
            profilePrivate: "यो प्रयोगकर्ताको प्रोफाइल निजी छ।",
            selectView: "तलको ड्रपडाउनबाट दृश्य चयन गर्नुहोस्:",
            timeout: "समय सकियो! चयन रद्द गरियो।",
            invalidChoice: "यो तपाईंको छनोट होइन!",
            statsCalculating: "तथ्याङ्कहरू गणना भइरहेको छ। केही मिनेटमा पुन: प्रयास गर्नुहोस्।",
            overview: "सिंहावलोकन",
            languages: "भाषाहरू",
            editors: "सम्पादक र OS",
            categories: "श्रेणीहरू",
            timeline: "समयरेखा"
        }
    },

    onStart: async function ({ message, interaction, args, getLang }) {
        const isSlash = !!interaction;
        const user = isSlash ? interaction.user : message.author;

        const username = isSlash ?
            interaction.options.getString('username') :
            args.join(" ");

        if (!username) {
            const response = getLang("syntaxError");
            return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
        }

        try {
            if (isSlash) {
                await interaction.deferReply();
            } else {
                await message.channel.send(getLang("fetching"));
            }

            let profileRes, statsRes;
            
            try {
                profileRes = await axios.get(`https://wakatime.com/api/v1/users/${encodeURIComponent(username)}`);
            } catch (e) {
                if (e.response?.status === 404) {
                    const response = getLang("notFound", username);
                    return isSlash ? interaction.editReply(response) : message.reply(response);
                }
                if (e.response?.status === 403 || e.response?.status === 401) {
                    const response = getLang("profilePrivate");
                    return isSlash ? interaction.editReply(response) : message.reply(response);
                }
                throw e;
            }

            try {
                statsRes = await axios.get(`https://wakatime.com/api/v1/users/${encodeURIComponent(username)}/stats/all_time`);
            } catch (e) {
                if (e.response?.status === 202) {
                    const response = getLang("statsCalculating");
                    return isSlash ? interaction.editReply(response) : message.reply(response);
                }
                if (e.response?.status === 403 || e.response?.status === 401) {
                    const response = getLang("profilePrivate");
                    return isSlash ? interaction.editReply(response) : message.reply(response);
                }
                if (e.response?.status !== 404) {
                    throw e;
                }
                statsRes = null;
            }

            if (!profileRes || profileRes.status !== 200) {
                const response = getLang("notFound", username);
                return isSlash ? interaction.editReply(response) : message.reply(response);
            }

            const profile = profileRes.data.data;
            const stats = statsRes?.data?.data || null;

            if (!stats || !stats.languages || stats.languages.length === 0) {
                const response = getLang("noStats");
                return isSlash ? interaction.editReply(response) : message.reply(response);
            }

            let sentMessage;
            if (isSlash) {
                await interaction.editReply({ content: "Loading..." });
                sentMessage = { interaction, isSlash: true };
            } else {
                sentMessage = await message.reply("Loading...");
                sentMessage.isSlash = false;
            }

            await showViewSelection(profile, stats, sentMessage, getLang, user);

        } catch (err) {
            console.error('WakaTime Error:', err);
            const errorMsg = getLang("error", err.message || "Unknown error");
            return isSlash ? 
                (interaction.deferred ? interaction.editReply(errorMsg) : interaction.reply({ content: errorMsg, ephemeral: true })) : 
                message.reply(errorMsg);
        }
    }
};

async function showViewSelection(profile, stats, sentMessage, getLang, user) {
    const menuId = `wakatime_view_${sentMessage.isSlash ? sentMessage.interaction.id : sentMessage.id}`;
    
    const options = [
        new StringSelectMenuOptionBuilder()
            .setLabel(getLang("overview"))
            .setDescription("Profile overview and key statistics")
            .setValue("overview"),
        new StringSelectMenuOptionBuilder()
            .setLabel(getLang("languages"))
            .setDescription("Programming languages breakdown")
            .setValue("languages"),
        new StringSelectMenuOptionBuilder()
            .setLabel(getLang("editors"))
            .setDescription("Code editors and operating systems")
            .setValue("editors"),
        new StringSelectMenuOptionBuilder()
            .setLabel(getLang("categories"))
            .setDescription("Activity categories distribution")
            .setValue("categories")
    ];

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(menuId)
        .setPlaceholder('Select a statistics view')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor(0x00a8e8)
        .setAuthor({
            name: `${profile.display_name || profile.username}'s WakaTime Profile`,
            iconURL: profile.photo || undefined,
            url: profile.profile_url
        })
        .setThumbnail(profile.photo || null)
        .setDescription(`**${getLang("selectView")}**\n\nTotal Coding Time: **${stats.human_readable_total || 'N/A'}**\nDaily Average: **${stats.human_readable_daily_average || 'N/A'}**\nActive Days: **${stats.days_minus_holidays || 0}**`)
        .setFooter({ text: `${user.username} | Timeout: 60s` })
        .setTimestamp();

    if (sentMessage.isSlash) {
        await sentMessage.interaction.editReply({ content: null, embeds: [embed], components: [row] });
    } else {
        await sentMessage.edit({ content: null, embeds: [embed], components: [row] });
    }

    global.RentoBot.onSelectMenu.set(menuId, async (selectInteraction) => {
        if (selectInteraction.user.id !== user.id) {
            return selectInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
        }

        const view = selectInteraction.values[0];
        await selectInteraction.deferUpdate();
        
        await showDetailedView(profile, stats, view, sentMessage, getLang, user);
    });

    setTimeout(() => {
        if (global.RentoBot.onSelectMenu.has(menuId)) {
            const timeoutEmbed = new EmbedBuilder()
                .setDescription(getLang("timeout"))
                .setColor(0x95A5A6);

            if (sentMessage.isSlash) {
                sentMessage.interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            } else {
                sentMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
            global.RentoBot.onSelectMenu.delete(menuId);
        }
    }, 60000);
}

async function showDetailedView(profile, stats, view, sentMessage, getLang, user) {
    const tmpDir = path.join(__dirname, 'tmp');
    fs.ensureDirSync(tmpDir);
    const timestamp = Date.now();

    let image, embed;

    try {
        switch (view) {
            case 'overview':
                image = await generateOverviewCard(profile, stats);
                embed = createOverviewEmbed(profile, stats, user);
                break;
            case 'languages':
                image = await generateLanguagesChart(stats.languages || [], profile);
                embed = createLanguagesEmbed(stats, user, profile);
                break;
            case 'editors':
                image = await generateEditorsOsChart(stats.editors || [], stats.operating_systems || [], profile);
                embed = createEditorsEmbed(stats, user, profile);
                break;
            case 'categories':
                image = await generateCategoriesChart(stats.categories || [], profile);
                embed = createCategoriesEmbed(stats, user, profile);
                break;
        }

        const imagePath = path.join(tmpDir, `waka_${view}_${timestamp}.png`);
        fs.writeFileSync(imagePath, image);

        const attachment = new AttachmentBuilder(imagePath, { name: `waka_${view}.png` });
        embed.setImage(`attachment://waka_${view}.png`);

        const backButtonId = `wakatime_back_${timestamp}_${user.id}`;
        const backButton = new ButtonBuilder()
            .setCustomId(backButtonId)
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Secondary);

        const linkButton = new ButtonBuilder()
            .setLabel('View on WakaTime')
            .setURL(profile.profile_url)
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(backButton, linkButton);

        if (sentMessage.isSlash) {
            await sentMessage.interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });
        } else {
            await sentMessage.edit({ embeds: [embed], files: [attachment], components: [row] });
        }

        global.RentoBot.onButton.set(backButtonId, async (buttonInteraction) => {
            if (buttonInteraction.user.id !== user.id) {
                return buttonInteraction.reply({ content: getLang("invalidChoice"), ephemeral: true });
            }

            await buttonInteraction.deferUpdate();
            global.RentoBot.onButton.delete(backButtonId);
            await showViewSelection(profile, stats, sentMessage, getLang, user);
        });

        setTimeout(() => {
            try { fs.unlinkSync(imagePath); } catch (e) {}
        }, 5000);

    } catch (error) {
        console.error('Error generating view:', error);
        throw error;
    }
}

function createOverviewEmbed(profile, stats, user) {
    const embed = new EmbedBuilder()
        .setColor(0x00a8e8)
        .setTitle(`${profile.display_name || profile.username} (@${profile.username})`)
        .setDescription(`**Profile Overview**`)
        .setURL(profile.profile_url);

    // Bio section
    if (profile.bio) {
        embed.setDescription(`**Profile Overview**\n\n*${profile.bio}*`);
    }

    // Stats fields
    embed.addFields(
        { name: 'Total Time', value: stats.human_readable_total || 'N/A', inline: true },
        { name: 'Daily Average', value: stats.human_readable_daily_average || 'N/A', inline: true },
        { name: 'Active Days', value: `${stats.days_minus_holidays || 0}`, inline: true }
    );

    // Location
    if (profile.city) {
        embed.addFields({ 
            name: 'Location', 
            value: `📍 ${profile.city.title || profile.city.short_title}`, 
            inline: true 
        });
    }

    // Member since
    if (profile.created_at) {
        const memberDate = new Date(profile.created_at);
        const formattedDate = memberDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        embed.addFields({ 
            name: 'Member Since', 
            value: `📅 ${formattedDate}`, 
            inline: true 
        });
    }

    // Hireable status
    if (profile.is_hireable !== undefined) {
        embed.addFields({ 
            name: 'Hireable', 
            value: profile.is_hireable ? '✅ Yes' : '❌ No', 
            inline: true 
        });
    }

    // Best day
    if (stats.best_day) {
        embed.addFields({ 
            name: 'Best Day', 
            value: `🏆 ${stats.best_day.date}\n${stats.best_day.text}`, 
            inline: false 
        });
    }

    // Social links
    const socialLinks = [];
    if (profile.github_username) {
        socialLinks.push(`[GitHub](https://github.com/${profile.github_username})`);
    }
    if (profile.linkedin_username) {
        socialLinks.push(`[LinkedIn](https://linkedin.com/in/${profile.linkedin_username})`);
    }
    if (profile.twitter_username) {
        socialLinks.push(`[Twitter](https://twitter.com/${profile.twitter_username})`);
    }
    if (profile.website) {
        socialLinks.push(`[Website](${profile.website})`);
    }

    if (socialLinks.length > 0) {
        embed.addFields({ 
            name: 'Connect', 
            value: socialLinks.join(' • '), 
            inline: false 
        });
    }

    embed.setFooter({ text: `Requested by ${user.username}` }).setTimestamp();
    return embed;
}

function createLanguagesEmbed(stats, user, profile) {
    const topLangs = (stats.languages || []).slice(0, 10);
    const description = topLangs.map((lang, i) => 
        `**${i + 1}.** ${lang.name} - ${lang.text} (${lang.percent.toFixed(1)}%)`
    ).join('\n');

    return new EmbedBuilder()
        .setColor(0x667eea)
        .setTitle(`${profile.display_name || profile.username} (@${profile.username})`)
        .setDescription(`**Programming Languages Distribution**\n\n${description || 'No language data available'}`)
        .setFooter({ text: `Requested by ${user.username}` })
        .setTimestamp();
}

function createEditorsEmbed(stats, user, profile) {
    const editors = (stats.editors || []).slice(0, 5).map((e, i) => 
        `**${i + 1}.** ${e.name} - ${e.text} (${e.percent.toFixed(1)}%)`
    ).join('\n');

    const os = (stats.operating_systems || []).map((o, i) => 
        `**${i + 1}.** ${o.name} - ${o.text} (${o.percent.toFixed(1)}%)`
    ).join('\n');

    return new EmbedBuilder()
        .setColor(0x764ba2)
        .setTitle(`${profile.display_name || profile.username} (@${profile.username})`)
        .setDescription(`**Development Environment**`)
        .addFields(
            { name: 'Code Editors', value: editors || 'N/A', inline: true },
            { name: 'Operating Systems', value: os || 'N/A', inline: true }
        )
        .setFooter({ text: `Requested by ${user.username}` })
        .setTimestamp();
}

function createCategoriesEmbed(stats, user, profile) {
    const cats = (stats.categories || []).map((c, i) => 
        `**${i + 1}.** ${c.name} - ${c.text} (${c.percent.toFixed(1)}%)`
    ).join('\n');

    return new EmbedBuilder()
        .setColor(0x4ecdc4)
        .setTitle(`${profile.display_name || profile.username} (@${profile.username})`)
        .setDescription(`**Activity Categories**\n\n${cats || 'No category data available'}`)
        .setFooter({ text: `Requested by ${user.username}` })
        .setTimestamp();
}

async function generateOverviewCard(profile, stats) {
    const width = 1200;
    const height = 500;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0d1117');
    bgGradient.addColorStop(0.5, '#161b22');
    bgGradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    roundedRect(ctx, 15, 15, width - 30, height - 30, 20);
    ctx.stroke();

    // Header
    const headerGradient = ctx.createLinearGradient(0, 30, width, 80);
    headerGradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    headerGradient.addColorStop(1, 'rgba(118, 75, 162, 0.4)');
    ctx.fillStyle = headerGradient;
    roundedRect(ctx, 30, 30, width - 60, 60, 15);
    ctx.fill();

    ctx.font = 'bold 32px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.display_name || profile.username} - WakaTime Stats`, width / 2, 70);

    // Avatar section
    const avatarX = 100;
    const avatarY = 170;
    const avatarSize = 140;

    if (profile.photo) {
        try {
            const avatar = await Canvas.loadImage(profile.photo);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 5;
            ctx.stroke();
        } catch (e) {}
    }

    // User info section
    ctx.textAlign = 'left';
    ctx.font = 'bold 36px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(profile.display_name || profile.username, 220, 140);

    ctx.font = '22px BeVietnamPro-Regular';
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`@${profile.username}`, 220, 175);

    let detailsY = 205;

    // Location
    if (profile.city) {
        ctx.font = '18px BeVietnamPro-Regular';
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText(`📍 ${profile.city.short_title || profile.city.name}`, 220, detailsY);
        detailsY += 30;
    }

    // Bio
    if (profile.bio) {
        ctx.font = '16px BeVietnamPro-Regular';
        ctx.fillStyle = '#b0b0b0';
        const bioText = profile.bio.length > 40 ? profile.bio.substring(0, 37) + '...' : profile.bio;
        ctx.fillText(`💭 ${bioText}`, 220, detailsY);
        detailsY += 30;
    }

    // Social links bar
    const socialsY = 120;
    const socialsX = width - 450;
    const iconSize = 28;
    const iconGap = 15;
    let currentX = socialsX;

    // GitHub
    if (profile.github_username) {
        const githubGradient = ctx.createLinearGradient(currentX, socialsY, currentX + iconSize, socialsY + iconSize);
        githubGradient.addColorStop(0, '#6e5494');
        githubGradient.addColorStop(1, '#4a3a6a');
        ctx.fillStyle = githubGradient;
        roundedRect(ctx, currentX, socialsY, iconSize, iconSize, 8);
        ctx.fill();
        
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('GH', currentX + iconSize / 2, socialsY + iconSize / 2 + 6);
        currentX += iconSize + iconGap;
    }

    // LinkedIn
    if (profile.linkedin_username) {
        const linkedinGradient = ctx.createLinearGradient(currentX, socialsY, currentX + iconSize, socialsY + iconSize);
        linkedinGradient.addColorStop(0, '#0077b5');
        linkedinGradient.addColorStop(1, '#005582');
        ctx.fillStyle = linkedinGradient;
        roundedRect(ctx, currentX, socialsY, iconSize, iconSize, 8);
        ctx.fill();
        
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('IN', currentX + iconSize / 2, socialsY + iconSize / 2 + 6);
        currentX += iconSize + iconGap;
    }

    // Twitter
    if (profile.twitter_username) {
        const twitterGradient = ctx.createLinearGradient(currentX, socialsY, currentX + iconSize, socialsY + iconSize);
        twitterGradient.addColorStop(0, '#1DA1F2');
        twitterGradient.addColorStop(1, '#0d8bd9');
        ctx.fillStyle = twitterGradient;
        roundedRect(ctx, currentX, socialsY, iconSize, iconSize, 8);
        ctx.fill();
        
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('X', currentX + iconSize / 2, socialsY + iconSize / 2 + 6);
        currentX += iconSize + iconGap;
    }

    // Website
    if (profile.website) {
        const websiteGradient = ctx.createLinearGradient(currentX, socialsY, currentX + iconSize, socialsY + iconSize);
        websiteGradient.addColorStop(0, '#667eea');
        websiteGradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = websiteGradient;
        roundedRect(ctx, currentX, socialsY, iconSize, iconSize, 8);
        ctx.fill();
        
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('🌐', currentX + iconSize / 2, socialsY + iconSize / 2 + 6);
        currentX += iconSize + iconGap;
    }

    // Member since badge
    if (profile.created_at) {
        const memberDate = new Date(profile.created_at);
        const year = memberDate.getFullYear();
        const badgeX = width - 200;
        const badgeY = 180;
        
        const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + 160, badgeY + 40);
        badgeGradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        badgeGradient.addColorStop(1, 'rgba(118, 75, 162, 0.3)');
        ctx.fillStyle = badgeGradient;
        roundedRect(ctx, badgeX, badgeY, 160, 40, 10);
        ctx.fill();
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        roundedRect(ctx, badgeX, badgeY, 160, 40, 10);
        ctx.stroke();
        
        ctx.font = '14px BeVietnamPro-Regular';
        ctx.fillStyle = '#8b949e';
        ctx.textAlign = 'center';
        ctx.fillText('Member Since', badgeX + 80, badgeY + 18);
        
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(year.toString(), badgeX + 80, badgeY + 34);
    }

    // Stats cards
    const statsY = 280;
    const cardWidth = 280;
    const cardHeight = 140;
    const gap = 30;

    const statsData = [
        { 
            label: 'Total Coding Time', 
            value: stats.human_readable_total || 'N/A',
            gradient: ['#667eea', '#764ba2']
        },
        { 
            label: 'Daily Average', 
            value: stats.human_readable_daily_average || 'N/A',
            gradient: ['#4ecdc4', '#44a08d']
        },
        { 
            label: 'Active Days', 
            value: `${stats.days_minus_holidays || 0} days`,
            gradient: ['#f093fb', '#f5576c']
        }
    ];

    statsData.forEach((stat, index) => {
        const x = 80 + (index * (cardWidth + gap));
        const y = statsY;

        // Card gradient background
        const cardGradient = ctx.createLinearGradient(x, y, x, y + cardHeight);
        cardGradient.addColorStop(0, stat.gradient[0] + '30');
        cardGradient.addColorStop(1, stat.gradient[1] + '30');
        ctx.fillStyle = cardGradient;
        roundedRect(ctx, x, y, cardWidth, cardHeight, 15);
        ctx.fill();

        // Card border
        ctx.strokeStyle = stat.gradient[0];
        ctx.lineWidth = 2;
        roundedRect(ctx, x, y, cardWidth, cardHeight, 15);
        ctx.stroke();

        // Label
        ctx.font = '16px BeVietnamPro-Regular';
        ctx.fillStyle = '#8b949e';
        ctx.textAlign = 'center';
        ctx.fillText(stat.label, x + cardWidth / 2, y + 40);

        // Value
        ctx.font = 'bold 28px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stat.value, x + cardWidth / 2, y + 85);

        // Accent line
        const lineGradient = ctx.createLinearGradient(x + 20, y + cardHeight - 20, x + cardWidth - 20, y + cardHeight - 20);
        lineGradient.addColorStop(0, stat.gradient[0]);
        lineGradient.addColorStop(1, stat.gradient[1]);
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + cardHeight - 20);
        ctx.lineTo(x + cardWidth - 20, y + cardHeight - 20);
        ctx.stroke();
    });

    return canvas.toBuffer();
}

async function generateLanguagesChart(languages, profile) {
    const width = 1400;
    const height = 700;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(1, '#161b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    roundedRect(ctx, 15, 15, width - 30, height - 30, 20);
    ctx.stroke();

    ctx.font = 'bold 32px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.display_name || profile.username} - Programming Languages`, width / 2, 60);

    const topLanguages = languages.slice(0, 12);
    const totalSeconds = topLanguages.reduce((sum, l) => sum + l.total_seconds, 0);

    // Donut chart
    const centerX = 350;
    const centerY = 380;
    const outerRadius = 220;
    const innerRadius = 120;
    let currentAngle = -Math.PI / 2;

    topLanguages.forEach((lang, index) => {
        const sliceAngle = (lang.total_seconds / totalSeconds) * 2 * Math.PI;
        const color = COLORS.languages[index % COLORS.languages.length];

        // Outer arc
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fill();

        // Separator
        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 3;
        ctx.stroke();

        currentAngle += sliceAngle;
    });

    // Center circle
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
    centerGradient.addColorStop(0, '#161b22');
    centerGradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 48px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(topLanguages.length, centerX, centerY + 10);
    ctx.font = '18px BeVietnamPro-Regular';
    ctx.fillStyle = '#8b949e';
    ctx.fillText('Languages', centerX, centerY + 35);

    // Legend with bars
    const legendX = 750;
    const legendY = 120;
    const itemHeight = 45;
    const barMaxWidth = 400;

    topLanguages.forEach((lang, index) => {
        const y = legendY + (index * itemHeight);
        const color = COLORS.languages[index % COLORS.languages.length];

        // Color indicator
        ctx.fillStyle = color;
        roundedRect(ctx, legendX, y, 25, 25, 6);
        ctx.fill();

        // Language name
        ctx.font = 'bold 18px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(lang.name, legendX + 40, y + 18);

        // Time
        ctx.font = '15px BeVietnamPro-Regular';
        ctx.fillStyle = '#8b949e';
        ctx.fillText(lang.text, legendX + 220, y + 18);

        // Percentage bar
        const barY = y + 28;
        const barHeight = 6;
        const barWidth = (lang.percent / 100) * barMaxWidth;

        // Background bar
        ctx.fillStyle = 'rgba(48, 54, 61, 0.6)';
        roundedRect(ctx, legendX, barY, barMaxWidth, barHeight, 3);
        ctx.fill();

        // Progress bar
        const barGradient = ctx.createLinearGradient(legendX, barY, legendX + barWidth, barY);
        barGradient.addColorStop(0, color);
        barGradient.addColorStop(1, adjustColor(color, 30));
        ctx.fillStyle = barGradient;
        roundedRect(ctx, legendX, barY, barWidth, barHeight, 3);
        ctx.fill();

        // Percentage text
        ctx.font = 'bold 15px BeVietnamPro-Bold';
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(`${lang.percent.toFixed(1)}%`, legendX + barMaxWidth + 50, y + 18);
    });

    return canvas.toBuffer();
}

async function generateEditorsOsChart(editors, operatingSystems, profile) {
    const width = 1400;
    const height = 700;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(1, '#161b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    roundedRect(ctx, 15, 15, width - 30, height - 30, 20);
    ctx.stroke();

    ctx.font = 'bold 32px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.display_name || profile.username} - Development Environment`, width / 2, 60);

    // Editors section - PIE CHART
    const editorsX = 350;
    const editorsY = 140;
    const topEditors = editors.slice(0, 6);

    ctx.font = 'bold 24px BeVietnamPro-Bold';
    ctx.fillStyle = '#667eea';
    ctx.textAlign = 'center';
    ctx.fillText('Code Editors', editorsX, editorsY);

    // Editors pie chart
    const editorCenterX = editorsX;
    const editorCenterY = editorsY + 230;
    const editorRadius = 150;
    const totalEditorTime = topEditors.reduce((sum, e) => sum + e.total_seconds, 0);
    let editorAngle = -Math.PI / 2;

    topEditors.forEach((editor, index) => {
        const sliceAngle = (editor.total_seconds / totalEditorTime) * 2 * Math.PI;
        const color = COLORS.editors[index % COLORS.editors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(editorCenterX, editorCenterY);
        ctx.arc(editorCenterX, editorCenterY, editorRadius, editorAngle, editorAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 4;
        ctx.stroke();

        if (editor.percent > 8) {
            const labelAngle = editorAngle + sliceAngle / 2;
            const labelX = editorCenterX + Math.cos(labelAngle) * (editorRadius * 0.65);
            const labelY = editorCenterY + Math.sin(labelAngle) * (editorRadius * 0.65);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px BeVietnamPro-Bold';
            ctx.textAlign = 'center';
            ctx.fillText(`${editor.percent.toFixed(0)}%`, labelX, labelY);
        }

        editorAngle += sliceAngle;
    });

    // Editors Legend
    const editorLegendY = editorsY + 430;
    const editorLegendX = 80;
    topEditors.forEach((editor, index) => {
        const y = editorLegendY + (index * 30);
        const color = COLORS.editors[index % COLORS.editors.length];

        ctx.fillStyle = color;
        roundedRect(ctx, editorLegendX, y, 20, 20, 5);
        ctx.fill();

        ctx.font = '16px BeVietnamPro-Regular';
        ctx.fillStyle = '#c9d1d9';
        ctx.textAlign = 'left';
        ctx.fillText(`${editor.name} - ${editor.text}`, editorLegendX + 30, y + 15);
    });

    // OS section
    const osX = 850;
    const osY = 120;

    ctx.font = 'bold 24px BeVietnamPro-Bold';
    ctx.fillStyle = '#764ba2';
    ctx.textAlign = 'left';
    ctx.fillText('Operating Systems', osX, osY);

    const osCenterX = osX + 250;
    const osCenterY = osY + 250;
    const osRadius = 150;
    const totalOsTime = operatingSystems.reduce((sum, os) => sum + os.total_seconds, 0);
    let osAngle = -Math.PI / 2;

    operatingSystems.forEach((os, index) => {
        const sliceAngle = (os.total_seconds / totalOsTime) * 2 * Math.PI;
        const color = COLORS.os[index % COLORS.os.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(osCenterX, osCenterY);
        ctx.arc(osCenterX, osCenterY, osRadius, osAngle, osAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#0d1117';
        ctx.lineWidth = 4;
        ctx.stroke();

        if (os.percent > 8) {
            const labelAngle = osAngle + sliceAngle / 2;
            const labelX = osCenterX + Math.cos(labelAngle) * (osRadius * 0.65);
            const labelY = osCenterY + Math.sin(labelAngle) * (osRadius * 0.65);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px BeVietnamPro-Bold';
            ctx.textAlign = 'center';
            ctx.fillText(`${os.percent.toFixed(0)}%`, labelX, labelY);
        }

        osAngle += sliceAngle;
    });

    // OS Legend
    const legendY = osY + 520;
    operatingSystems.forEach((os, index) => {
        const x = osX + (index * 200);
        const color = COLORS.os[index % COLORS.os.length];

        ctx.fillStyle = color;
        roundedRect(ctx, x, legendY, 20, 20, 5);
        ctx.fill();

        ctx.font = '16px BeVietnamPro-Regular';
        ctx.fillStyle = '#c9d1d9';
        ctx.textAlign = 'left';
        ctx.fillText(`${os.name}`, x + 30, legendY + 15);
    });

    return canvas.toBuffer();
}

async function generateCategoriesChart(categories, profile) {
    const width = 1400;
    const height = 600;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0d1117');
    gradient.addColorStop(1, '#161b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    roundedRect(ctx, 15, 15, width - 30, height - 30, 20);
    ctx.stroke();

    ctx.font = 'bold 32px BeVietnamPro-Bold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.display_name || profile.username} - Activity Categories`, width / 2, 60);

    if (categories.length === 0) {
        ctx.font = '20px BeVietnamPro-Regular';
        ctx.fillStyle = '#8b949e';
        ctx.fillText('No category data available', width / 2, height / 2);
        return canvas.toBuffer();
    }

    const chartX = 120;
    const chartY = 140;
    const chartWidth = width - 240;
    const chartHeight = 350;

    const maxPercent = Math.max(...categories.map(c => c.percent));
    const barWidth = chartWidth / categories.length;

    categories.forEach((cat, index) => {
        const barH = (cat.percent / maxPercent) * chartHeight;
        const x = chartX + (index * barWidth);
        const y = chartY + chartHeight - barH;
        const color = COLORS.categories[index % COLORS.categories.length];

        // Bar with gradient
        const barGradient = ctx.createLinearGradient(0, y, 0, y + barH);
        barGradient.addColorStop(0, color);
        barGradient.addColorStop(1, adjustColor(color, -40));
        ctx.fillStyle = barGradient;

        const padding = 20;
        const actualBarWidth = barWidth - (padding * 2);
        roundedRect(ctx, x + padding, y, actualBarWidth, barH, 12);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Percentage on top
        ctx.font = 'bold 18px BeVietnamPro-Bold';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${cat.percent.toFixed(1)}%`, x + barWidth / 2, y - 30);

        // Time text
        ctx.font = '14px BeVietnamPro-Regular';
        ctx.fillStyle = color;
        ctx.fillText(cat.text, x + barWidth / 2, y - 10);

        // Category name (rotated)
        ctx.save();
        ctx.translate(x + barWidth / 2, chartY + chartHeight + 30);
        ctx.rotate(-Math.PI / 6);
        ctx.font = 'bold 16px BeVietnamPro-Bold';
        ctx.fillStyle = '#c9d1d9';
        ctx.textAlign = 'right';
        ctx.fillText(cat.name, 0, 0);
        ctx.restore();
    });

    // Baseline
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chartX - 10, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth + 10, chartY + chartHeight);
    ctx.stroke();

    return canvas.toBuffer();
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
