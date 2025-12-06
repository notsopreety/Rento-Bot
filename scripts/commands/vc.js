
const { PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    config: {
        name: "vc",
        aliases: ["voicechannel", "voice"],
        version: "1.0",
        author: "Samir",
        countDown: 5,
        role: 1,
        description: {
            en: "Manage voice channels - create, delete, join, and leave",
            ne: "आवाज च्यानलहरू व्यवस्थापन गर्नुहोस् - सिर्जना, मेटाउन, सामेल हुन र छोड्न"
        },
        category: "admin",
        guide: {
            en: "{prefix}vc create <name> - Create a voice channel\n{prefix}vc delete <channel_id or name> - Delete a voice channel\n{prefix}vc join <channel_id or name> - Bot joins voice channel\n{prefix}vc leave - Bot leaves current voice channel\n{prefix}vc list - List all voice channels",
            ne: "{prefix}vc create <नाम> - आवाज च्यानल सिर्जना गर्नुहोस्\n{prefix}vc delete <च्यानल_id वा नाम> - आवाज च्यानल मेटाउनुहोस्\n{prefix}vc join <च्यानल_id वा नाम> - बट आवाज च्यानलमा सामेल हुन्छ\n{prefix}vc leave - बट हालको आवाज च्यानल छोड्छ\n{prefix}vc list - सबै आवाज च्यानलहरू सूचीबद्ध गर्नुहोस्"
        },
        slash: true,
        options: [
            {
                name: "action",
                description: "Action to perform (create/delete/join/leave/list)",
                type: 3,
                required: true,
                choices: [
                    { name: "create", value: "create" },
                    { name: "delete", value: "delete" },
                    { name: "join", value: "join" },
                    { name: "leave", value: "leave" },
                    { name: "list", value: "list" }
                ]
            },
            {
                name: "name",
                description: "Voice channel name or ID",
                type: 3,
                required: false
            }
        ]
    },

    langs: {
        en: {
            invalidAction: "❌ Invalid action! Use: create, delete, join, leave, or list",
            noName: "❌ Please provide a voice channel name!",
            noChannel: "❌ Please provide a voice channel name or ID!",
            createSuccess: "✅ Successfully created voice channel: **%1**",
            createError: "❌ Failed to create voice channel: %1",
            deleteSuccess: "✅ Successfully deleted voice channel: **%1**",
            deleteError: "❌ Failed to delete voice channel: %1",
            channelNotFound: "❌ Voice channel not found!",
            notVoiceChannel: "❌ The specified channel is not a voice channel!",
            joinSuccess: "✅ Successfully joined voice channel: **%1**",
            joinError: "❌ Failed to join voice channel: %1",
            alreadyInChannel: "⚠️ Bot is already in voice channel: **%1**",
            notInVoice: "❌ Bot is not in any voice channel!",
            leaveSuccess: "✅ Successfully left voice channel: **%1**",
            leaveError: "❌ Failed to leave voice channel: %1",
            noVoiceChannels: "❌ No voice channels found in this server!",
            voiceChannelsList: "**Voice Channels in %1:**",
            missingPermissions: "❌ I don't have permission to %1 voice channels!",
            guildOnly: "❌ This command can only be used in a server!"
        },
        ne: {
            invalidAction: "❌ अमान्य कार्य! प्रयोग गर्नुहोस्: create, delete, join, leave, वा list",
            noName: "❌ कृपया आवाज च्यानल नाम प्रदान गर्नुहोस्!",
            noChannel: "❌ कृपया आवाज च्यानल नाम वा ID प्रदान गर्नुहोस्!",
            createSuccess: "✅ सफलतापूर्वक आवाज च्यानल सिर्जना गरियो: **%1**",
            createError: "❌ आवाज च्यानल सिर्जना गर्न असफल: %1",
            deleteSuccess: "✅ सफलतापूर्वक आवाज च्यानल मेटाइयो: **%1**",
            deleteError: "❌ आवाज च्यानल मेटाउन असफल: %1",
            channelNotFound: "❌ आवाज च्यानल फेला परेन!",
            notVoiceChannel: "❌ निर्दिष्ट च्यानल आवाज च्यानल होइन!",
            joinSuccess: "✅ सफलतापूर्वक आवाज च्यानलमा सामेल भयो: **%1**",
            joinError: "❌ आवाज च्यानलमा सामेल हुन असफल: %1",
            alreadyInChannel: "⚠️ बट पहिले नै आवाज च्यानलमा छ: **%1**",
            notInVoice: "❌ बट कुनै पनि आवाज च्यानलमा छैन!",
            leaveSuccess: "✅ सफलतापूर्वक आवाज च्यानल छोडियो: **%1**",
            leaveError: "❌ आवाज च्यानल छोड्न असफल: %1",
            noVoiceChannels: "❌ यो सर्भरमा कुनै आवाज च्यानलहरू फेला परेनन्!",
            voiceChannelsList: "**%1 मा आवाज च्यानलहरू:**",
            missingPermissions: "❌ मसँग आवाज च्यानलहरू %1 गर्ने अनुमति छैन!",
            guildOnly: "❌ यो आदेश सर्भरमा मात्र प्रयोग गर्न सकिन्छ!"
        }
    },

    onStart: async ({ message, interaction, args, getLang, client }) => {
        const isSlash = !!interaction;
        const guild = isSlash ? interaction.guild : message.guild;

        if (!guild) {
            const response = getLang("guildOnly");
            return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
        }

        const action = isSlash ? interaction.options.getString('action') : args?.[0];
        const channelInput = isSlash ? interaction.options.getString('name') : args?.slice(1).join(' ');

        if (!action) {
            const response = getLang("invalidAction");
            return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
        }

        const botMember = guild.members.cache.get(client.user.id);

        switch (action.toLowerCase()) {
            case 'create': {
                if (!channelInput) {
                    const response = getLang("noName");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    const response = getLang("missingPermissions", "create");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                try {
                    const voiceChannel = await guild.channels.create({
                        name: channelInput,
                        type: ChannelType.GuildVoice,
                        reason: `Voice channel created by ${isSlash ? interaction.user.tag : message.author.tag}`
                    });

                    const response = getLang("createSuccess", voiceChannel.name);
                    return isSlash ? interaction.reply(response) : message.reply(response);
                } catch (error) {
                    const response = getLang("createError", error.message);
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }
            }

            case 'delete': {
                if (!channelInput) {
                    const response = getLang("noChannel");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    const response = getLang("missingPermissions", "delete");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                let voiceChannel = guild.channels.cache.get(channelInput);
                
                if (!voiceChannel) {
                    voiceChannel = guild.channels.cache.find(
                        ch => ch.type === ChannelType.GuildVoice && 
                              ch.name.toLowerCase() === channelInput.toLowerCase()
                    );
                }

                if (!voiceChannel) {
                    const response = getLang("channelNotFound");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                if (voiceChannel.type !== ChannelType.GuildVoice) {
                    const response = getLang("notVoiceChannel");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                try {
                    const channelName = voiceChannel.name;
                    await voiceChannel.delete(`Deleted by ${isSlash ? interaction.user.tag : message.author.tag}`);
                    
                    const response = getLang("deleteSuccess", channelName);
                    return isSlash ? interaction.reply(response) : message.reply(response);
                } catch (error) {
                    const response = getLang("deleteError", error.message);
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }
            }

            case 'join': {
                if (!channelInput) {
                    const response = getLang("noChannel");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                if (!botMember.permissions.has(PermissionFlagsBits.Connect) || 
                    !botMember.permissions.has(PermissionFlagsBits.Speak)) {
                    const response = getLang("missingPermissions", "join");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                let voiceChannel = guild.channels.cache.get(channelInput);
                
                if (!voiceChannel) {
                    voiceChannel = guild.channels.cache.find(
                        ch => ch.type === ChannelType.GuildVoice && 
                              ch.name.toLowerCase() === channelInput.toLowerCase()
                    );
                }

                if (!voiceChannel) {
                    const response = getLang("channelNotFound");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                if (voiceChannel.type !== ChannelType.GuildVoice) {
                    const response = getLang("notVoiceChannel");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                const existingConnection = getVoiceConnection(guild.id);
                if (existingConnection && existingConnection.joinConfig.channelId === voiceChannel.id) {
                    const response = getLang("alreadyInChannel", voiceChannel.name);
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                try {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        adapterCreator: guild.voiceAdapterCreator,
                        selfDeaf: false,
                        selfMute: false
                    });

                    connection.on(VoiceConnectionStatus.Ready, () => {
                        console.log(`[VC] Bot joined voice channel: ${voiceChannel.name} in ${guild.name}`);
                    });

                    connection.on(VoiceConnectionStatus.Disconnected, () => {
                        console.log(`[VC] Bot disconnected from voice channel in ${guild.name}`);
                    });

                    const response = getLang("joinSuccess", voiceChannel.name);
                    return isSlash ? interaction.reply(response) : message.reply(response);
                } catch (error) {
                    const response = getLang("joinError", error.message);
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }
            }

            case 'leave': {
                const connection = getVoiceConnection(guild.id);
                
                if (!connection) {
                    const response = getLang("notInVoice");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                try {
                    const channelId = connection.joinConfig.channelId;
                    const voiceChannel = guild.channels.cache.get(channelId);
                    const channelName = voiceChannel ? voiceChannel.name : "Unknown Channel";
                    
                    connection.destroy();
                    
                    const response = getLang("leaveSuccess", channelName);
                    return isSlash ? interaction.reply(response) : message.reply(response);
                } catch (error) {
                    const response = getLang("leaveError", error.message);
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }
            }

            case 'list': {
                const voiceChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice);
                
                if (voiceChannels.size === 0) {
                    const response = getLang("noVoiceChannels");
                    return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
                }

                const embed = new EmbedBuilder()
                    .setTitle(getLang("voiceChannelsList", guild.name))
                    .setColor('#5865F2')
                    .setTimestamp();

                const connection = getVoiceConnection(guild.id);
                const currentChannelId = connection?.joinConfig?.channelId;

                const channelList = voiceChannels.map((channel, index) => {
                    const members = channel.members.size;
                    const isBotHere = channel.id === currentChannelId ? '🔊 ' : '';
                    return `${index + 1}. ${isBotHere}**${channel.name}** (ID: ${channel.id})\n   👥 Members: ${members}`;
                }).join('\n\n');

                embed.setDescription(channelList);

                if (currentChannelId) {
                    const currentChannel = voiceChannels.get(currentChannelId);
                    if (currentChannel) {
                        embed.setFooter({ text: `Bot is currently in: ${currentChannel.name}` });
                    }
                }

                return isSlash ? interaction.reply({ embeds: [embed] }) : message.reply({ embeds: [embed] });
            }

            default: {
                const response = getLang("invalidAction");
                return isSlash ? interaction.reply({ content: response, ephemeral: true }) : message.reply(response);
            }
        }
    }
};
