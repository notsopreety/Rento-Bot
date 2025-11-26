const { Events, EmbedBuilder } = require('discord.js');
const log = require('../logger/log');
const permissions = require('../utils/permissions');
const errorNotifier = require('../logger/errorNotifier');

module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;

        const { RentoBot, db, utils } = global;
        const { config } = RentoBot;

        const guildID = message.guildId || message.channelId;
        const userID = message.author.id;

        // Detailed message logging
        let logDetails = [`New message from ${message.author.tag} (${message.author.id}) in ${message.guild?.name || 'DM'} (#${message.channel.name || 'DM'})`];

        if (message.content) {
            logDetails.push(`Content: "${message.content}"`);
        }

        if (message.attachments.size > 0) {
            logDetails.push(`\n📎 Attachments (${message.attachments.size}):`);
            message.attachments.forEach(attachment => {
                logDetails.push(`  - ${attachment.name} (${attachment.contentType || 'unknown type'}) - Size: ${(attachment.size / 1024).toFixed(2)}KB`);
                logDetails.push(`    URL: ${attachment.url}`);
            });
        }

        if (message.stickers.size > 0) {
            logDetails.push(`\n🎨 Stickers (${message.stickers.size}):`);
            message.stickers.forEach(sticker => {
                logDetails.push(`  - ${sticker.name} (${sticker.format}) - ID: ${sticker.id}`);
                logDetails.push(`    URL: ${sticker.url}`);
            });
        }

        if (message.embeds.length > 0) {
            logDetails.push(`\n📋 Embeds (${message.embeds.length}):`);
            message.embeds.forEach((embed, i) => {
                logDetails.push(`  [${i + 1}] ${embed.title || 'No title'} - ${embed.description?.substring(0, 50) || 'No description'}...`);
                if (embed.url) logDetails.push(`    URL: ${embed.url}`);
            });
        }

        if (message.reactions.cache.size > 0) {
            logDetails.push(`\n⭐ Reactions: ${message.reactions.cache.map(r => `${r.emoji.name}(${r.count})`).join(', ')}`);
        }

        if (message.reference) {
            logDetails.push(`\n↩️ Reply to message ID: ${message.reference.messageId}`);
        }

        if (message.type !== 0) {
            const typeNames = {
                1: 'RECIPIENT_ADD', 2: 'RECIPIENT_REMOVE', 3: 'CALL', 4: 'CHANNEL_NAME_CHANGE',
                5: 'CHANNEL_ICON_CHANGE', 6: 'CHANNEL_PINNED_MESSAGE', 7: 'USER_JOIN',
                8: 'GUILD_BOOST', 9: 'GUILD_BOOST_TIER_1', 10: 'GUILD_BOOST_TIER_2',
                11: 'GUILD_BOOST_TIER_3', 19: 'REPLY', 20: 'CHAT_INPUT_COMMAND'
            };
            logDetails.push(`\n📌 Message Type: ${typeNames[message.type] || message.type}`);
        }

        log.info("MESSAGE", logDetails.join('\n'));

        // For DMs, create a minimal guild data object without database interaction
        let guildData;
        if (!message.guildId) {
            // DM message - use default settings
            guildData = {
                guildID: guildID,
                guildName: "Direct Message",
                prefix: RentoBot.config.bot.prefix,
                adminIDs: [],
                settings: { language: 'en' },
                data: {},
                stats: {},
                banned: { status: false }
            };
        } else {
            // Guild message - fetch from database
            guildData = await db.guildsData.get(guildID);
        }

        let userData = await db.usersData.get(userID);

        const prefix = utils.getPrefix(guildID);

        // Only update guild info for actual guild messages (not DMs)
        if (message.guildId && message.guild && db.guildsData.updateGuildInfo) {
            db.guildsData.updateGuildInfo(guildID).catch(err => 
                console.error("Failed to update guild info:", err)
            );
        }

        if (guildData.banned.status) return;

        // Allow banned users to only use appeal command
        if (userData.banned.status) {
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (commandName !== 'appeal' && !['unban-request', 'appealban'].includes(commandName)) {
                return message.reply("❌ You are banned from using this bot. Use `" + prefix + "appeal <reason>` to appeal your ban.");
            }
        }

        await db.usersData.set(userID, (userData.stats?.totalMessages || 0) + 1, 'stats.totalMessages');

        // Only update guild stats for actual guilds (not DMs)
        if (message.guildId) {
            await db.guildsData.set(guildID, (guildData.stats?.totalMessages || 0) + 1, 'stats.totalMessages');
        }

        if (!message.content.startsWith(prefix)) {
            const allOnChat = RentoBot.onChat || [];
            const allOnChatEvents = RentoBot.onChatEvents || [];
            const args = message.content ? message.content.split(/ +/) : [];

            // Process command onChat handlers
            for (const commandName of allOnChat) {
                const command = RentoBot.commands.get(commandName.toLowerCase());
                if (!command || !command.onChat) continue;

                try {
                    const getLang = (key, ...args_) => {
                        if (command.langs) {
                            const userLang = userData.settings?.language || guildData.settings?.language || 'en';
                            const lang = command.langs[userLang]?.[key] || command.langs?.['en']?.[key] || key;
                            return utils.getText({ [key]: lang }, key, ...args_);
                        }
                        return key;
                    };

                    await command.onChat({
                        message,
                        event: message,
                        client,
                        args,
                        usersData: db.usersData,
                        guildsData: db.guildsData,
                        guildData,
                        userData,
                        prefix,
                        commandName,
                        getLang
                    });
                } catch (error) {
                    log.error("ONCHAT", `Error in onChat handler for ${commandName}: ${error.message}`);
                    console.error(error);

                    errorNotifier.notifyError(error, {
                        location: `onChat Handler: ${commandName}`,
                        command: commandName,
                        user: message.author.tag
                    }).catch(() => {});
                }
            }

            // Process event onChat handlers
            for (const eventName of allOnChatEvents) {
                const event = RentoBot.eventCommands.get(eventName);
                if (!event || !event.onChat) continue;

                try {
                    const getLang = (key, ...args_) => {
                        if (event.langs) {
                            const userLang = userData.settings?.language || guildData.settings?.language || 'en';
                            const lang = event.langs[userLang]?.[key] || event.langs?.['en']?.[key] || key;
                            return utils.getText({ [key]: lang }, key, ...args_);
                        }
                        return key;
                    };

                    await event.onChat({
                        message,
                        event: message,
                        client,
                        args,
                        usersData: db.usersData,
                        guildsData: db.guildsData,
                        guildData,
                        userData,
                        prefix,
                        getLang
                    });
                } catch (error) {
                    log.error("ONCHAT-EVENT", `Error in onChat handler for event ${eventName}: ${error.message}`);
                    console.error(error);

                    errorNotifier.notifyError(error, {
                        location: `onChat Event Handler: ${eventName}`,
                        command: eventName,
                        user: message.author.tag
                    }).catch(() => {});
                }
            }

            if (message.reference?.messageId) {
                const repliedMsgId = message.reference.messageId;
                const onReplyHandler = RentoBot.onReply.get(repliedMsgId);

                if (onReplyHandler) {
                    // Check if user is authorized to reply
                    // Support both single author and multiple participants
                    const isAuthorized = onReplyHandler.author === userID || 
                                        (onReplyHandler.participants && onReplyHandler.participants.includes(userID));

                    if (isAuthorized) {
                        try {
                            await onReplyHandler.handler({
                                message,
                                client,
                                args: message.content.trim().split(/ +/),
                                usersData: db.usersData,
                                guildsData: db.guildsData,
                                guildData,
                                userData,
                                getLang: (key, ...args_) => {
                                    const command = RentoBot.commands.get(onReplyHandler.commandName.toLowerCase());
                                    if (command?.langs) {
                                        const userLang = userData.settings?.language || guildData.settings?.language || 'en';
                                        const lang = command.langs[userLang]?.[key] || command.langs?.['en']?.[key] || key;
                                        return utils.getText({ [key]: lang }, key, ...args_);
                                    }
                                    return key;
                                }
                            });
                        } catch (error) {
                            log.error("ONREPLY", `Error in onReply handler: ${error.message}`);
                            console.error(error);

                            errorNotifier.notifyError(error, {
                                location: `onReply Handler: ${onReplyHandler.commandName || 'Unknown'}`,
                                command: onReplyHandler.commandName || 'Unknown',
                                user: message.author.tag
                            }).catch(() => {});
                        }
                    }
                }
            }

            const expGain = Math.floor(Math.random() * 15) + 10;
            const currentExp = userData.exp || 0;
            const newExp = currentExp + expGain;

            const oldLevel = utils.calculateLevel(currentExp);
            const newLevel = utils.calculateLevel(newExp);

            await db.usersData.set(userID, { exp: newExp });

            // Check if user leveled up
            if (newLevel > oldLevel && guildData.settings.levelUpEnabled) {
                const levelUpMessage = guildData.data.levelUpMessage || 
                    `🎊 Congratulations {userMention}! You've reached **Level {level}**! 🎉\n💎 Total XP: **{xp}**`;

                const formattedMessage = levelUpMessage
                    .replace(/{user}/g, `<@${message.author.id}>`)
                    .replace(/{userMention}/g, `<@${message.author.id}>`)
                    .replace(/{userName}/g, message.author.username)
                    .replace(/{level}/g, newLevel)
                    .replace(/{xp}/g, newExp);

                const embed = new EmbedBuilder()
                    .setDescription(formattedMessage)
                    .setColor(0xFFD700)
                    .setTimestamp();

                if (guildData.settings.levelUpChannel) {
                    const channel = message.guild.channels.cache.get(guildData.settings.levelUpChannel);
                    if (channel) {
                        channel.send({ embeds: [embed] }).catch(() => {});
                    }
                } else {
                    // Reply to the user's message in the same channel
                    message.reply({ embeds: [embed] }).catch(() => {});
                }
            }

            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = RentoBot.commands.get(commandName) || 
                       RentoBot.commands.get(RentoBot.aliases.get(commandName));

        if (!command) {
            return message.reply(`❌ Command \`${commandName}\` doesn't exist. Use \`${prefix}help\` to see available commands.`);
        }

        log.info("COMMAND", `${message.author.tag} executing command: ${prefix}${commandName}`);

        const accessCheck = permissions.canExecuteCommand({
            userID,
            guildID: message.guildId,
            channelID: message.channelId,
            config,
            isDM: !message.guildId
        });

        if (!accessCheck.allowed) {
            return message.reply(accessCheck.reason);
        }

        if (command.config.role === 2 && !config.bot.adminBot.includes(userID)) {
            return message.reply("❌ This command is only for bot administrators.");
        }

        if (command.config.role === 1) {
            if (message.guild) {
                const member = message.guild.members.cache.get(userID);
                if (!member.permissions.has('Administrator') && !guildData.adminIDs.includes(userID)) {
                    return message.reply("❌ This command requires administrator permissions.");
                }
            }
        }

        // Check if command has onStart
        if (!command.onStart || typeof command.onStart !== 'function') {
            return message.reply(`❌ Command \`${commandName}\` isn't executable. This command may only work with slash commands or in specific contexts.`);
        }

        try {
            await db.usersData.set(userID, (userData.stats?.totalCommandsUsed || 0) + 1, 'stats.totalCommandsUsed');

            // Only update guild stats for actual guilds (not DMs)
            if (message.guildId) {
                await db.guildsData.set(guildID, (guildData.stats?.totalCommandsUsed || 0) + 1, 'stats.totalCommandsUsed');
            }

            if (db.commandStatsData) {
                await db.commandStatsData.incrementUsage(commandName);
            }

            const parameters = {
                message,
                args,
                client,
                usersData: db.usersData,
                guildsData: db.guildsData,
                db,
                guildData,
                userData,
                prefix,
                role: command.config.role, // Assuming 'role' is intended to be command's role requirement
                getLang: (key, ...args_) => {
                    const userLang = userData.settings?.language || guildData.settings?.language || 'en';
                    const lang = command.langs?.[userLang]?.[key] || command.langs?.['en']?.[key] || key;
                    return utils.getText({ [key]: lang }, key, ...args_);
                }
            };

            await command.onStart(parameters);
        } catch (error) {
            log.error("COMMAND", `Error executing ${commandName}: ${error.message}`);
            message.reply(`❌ An error occurred while executing this command.`);
            console.error(error);

            errorNotifier.notifyError(error, {
                location: `Command: ${commandName}`,
                command: commandName,
                user: message.author.tag
            }).catch(() => {});
        }
    });
};