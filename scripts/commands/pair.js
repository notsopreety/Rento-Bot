
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: "pair",
        aliases: ["ship", "couple"],
        version: "2.0",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "Pair two random users from the server and see their compatibility",
            ne: "सर्भरबाट दुई अनियमित प्रयोगकर्ताहरू जोडी बनाउनुहोस् र तिनीहरूको मिलापन हेर्नुहोस्"
        },
        category: "fun",
        guide: {
            en: "{prefix}pair - Randomly pair two users from the server",
            ne: "{prefix}pair - सर्भरबाट दुई प्रयोगकर्ताहरू अनियमित रूपमा जोडी बनाउनुहोस्"
        },
        slash: true
    },

    langs: {
        en: {
            loading: "🔮 Finding the perfect match...",
            error: "❌ Failed to generate ship image. Please try again!",
            notEnoughUsers: "❌ Not enough users in the server to create a pair!",
            shipTitle: "💕 Love Calculator 💕",
            compatibility: "Compatibility: **%1%**",
            couple: "**%1** 💖 **%2**",
            fetchError: "❌ Unable to fetch server members. Using cached members..."
        },
        ne: {
            loading: "🔮 उत्तम मिलान खोज्दै...",
            error: "❌ जहाज छवि उत्पन्न गर्न असफल। कृपया फेरि प्रयास गर्नुहोस्!",
            notEnoughUsers: "❌ जोडी बनाउन सर्भरमा पर्याप्त प्रयोगकर्ताहरू छैनन्!",
            shipTitle: "💕 प्रेम क्याल्कुलेटर 💕",
            compatibility: "मिलाप: **%1%**",
            couple: "**%1** 💖 **%2**",
            fetchError: "❌ सर्भर सदस्यहरू प्राप्त गर्न असमर्थ। क्याश गरिएको सदस्यहरू प्रयोग गर्दै..."
        }
    },

    onStart: async ({ message, interaction, getLang, client }) => {
        const isSlash = !!interaction;
        let sentMessage;

        try {
            // Send loading message
            const loadingMsg = getLang("loading");
            
            if (isSlash) {
                await interaction.reply(loadingMsg);
            } else {
                sentMessage = await message.reply(loadingMsg);
            }

            // Get guild
            const guild = isSlash ? interaction.guild : message.guild;
            
            // Try to fetch members with better error handling
            let useCachedOnly = false;
            try {
                await guild.members.fetch({ limit: 1000, timeout: 3000 });
            } catch (fetchError) {
                console.log(`[PAIR] Members fetch failed: ${fetchError.message}, using cached members`);
                useCachedOnly = true;
            }
            
            // Filter out bots and get human users only
            const members = guild.members.cache.filter(member => !member.user.bot);
            
            if (members.size < 2) {
                const errorMsg = getLang("notEnoughUsers");
                if (isSlash) {
                    return await interaction.editReply(errorMsg);
                } else {
                    return await sentMessage.edit(errorMsg);
                }
            }

            // Get two random members
            const membersArray = Array.from(members.values());
            const shuffled = membersArray.sort(() => Math.random() - 0.5);
            const user1 = shuffled[0].user;
            const user2 = shuffled[1].user;

            // Get avatar URLs (use png format for better compatibility)
            const avatar1 = user1.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
            const avatar2 = user2.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });

            // Calculate compatibility percentage (deterministic based on user IDs for consistency)
            const combined = user1.id + user2.id;
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                hash = ((hash << 5) - hash) + combined.charCodeAt(i);
                hash = hash & hash;
            }
            const compatibility = Math.abs(hash) % 101;

            // Try to get ship image from API
            let shipImageBuffer = null;
            try {
                const encodedAvatar1 = encodeURIComponent(avatar1);
                const encodedAvatar2 = encodeURIComponent(avatar2);
                const apiUrl = `https://api.popcat.xyz/ship?user1=${encodedAvatar1}&user2=${encodedAvatar2}`;
                
                const response = await axios.get(apiUrl, {
                    responseType: 'arraybuffer',
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Discord-Bot'
                    }
                });
                
                shipImageBuffer = Buffer.from(response.data);
            } catch (apiError) {
                console.log(`[PAIR] Ship API failed: ${apiError.message}`);
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(getLang("shipTitle"))
                .setDescription(getLang("couple", user1.username, user2.username))
                .addFields({
                    name: '📊 ' + getLang("compatibility", compatibility),
                    value: generateProgressBar(compatibility)
                })
                .setColor(getColorByCompatibility(compatibility))
                .setFooter({ text: `${user1.tag} × ${user2.tag}` })
                .setTimestamp();

            const replyOptions = {
                content: '',
                embeds: [embed]
            };

            // Add image if available
            if (shipImageBuffer) {
                embed.setImage('attachment://ship.png');
                replyOptions.files = [{
                    attachment: shipImageBuffer,
                    name: 'ship.png'
                }];
            } else {
                // Set user avatars as thumbnail and image if API fails
                embed.setThumbnail(avatar1);
                embed.setImage(avatar2);
            }

            if (isSlash) {
                await interaction.editReply(replyOptions);
            } else {
                await sentMessage.edit(replyOptions);
            }

        } catch (error) {
            console.error("[PAIR] Command error:", error);
            const errorMsg = getLang("error");
            
            try {
                if (isSlash) {
                    if (interaction.replied || interaction.deferred) {
                        return await interaction.editReply({ content: errorMsg, embeds: [], files: [] });
                    }
                    return await interaction.reply({ content: errorMsg, ephemeral: true });
                } else {
                    if (sentMessage) {
                        return await sentMessage.edit({ content: errorMsg, embeds: [], files: [] });
                    }
                    return await message.reply(errorMsg);
                }
            } catch (replyError) {
                console.error("[PAIR] Error sending error message:", replyError);
            }
        }
    }
};

// Helper function to generate progress bar
function generateProgressBar(percentage) {
    const totalBars = 10;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    
    const filled = '█'.repeat(filledBars);
    const empty = '░'.repeat(emptyBars);
    
    return `${filled}${empty} ${percentage}%`;
}

// Helper function to get color based on compatibility
function getColorByCompatibility(percentage) {
    if (percentage >= 80) return 0xFF1493; // Deep Pink - High compatibility
    if (percentage >= 60) return 0xFF69B4; // Hot Pink - Good compatibility
    if (percentage >= 40) return 0xFFA500; // Orange - Medium compatibility
    if (percentage >= 20) return 0xFFFF00; // Yellow - Low compatibility
    return 0x808080; // Gray - Very low compatibility
}
