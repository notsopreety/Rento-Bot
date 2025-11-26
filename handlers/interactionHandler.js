const { Events, InteractionType } = require('discord.js');
const log = require('../logger/log');
const { resolveInteractionContext } = require('./helpers/interactionContext');
const permissions = require('../utils/permissions');
const errorNotifier = require('../logger/errorNotifier');

module.exports = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        const { RentoBot, db, utils } = global;

        try {
            if (interaction.type === InteractionType.ApplicationCommand) {
                const command = RentoBot.commands.get(interaction.commandName.toLowerCase());
                if (!command) return;

                log.info("INTERACTION", `${interaction.user.tag} used slash command: /${interaction.commandName}`);

                const context = await resolveInteractionContext(interaction);
                const { guildData, userData, role, prefix, guildID, userID } = context;

                if (userData.banned?.status) {
                    if (interaction.commandName !== 'appeal') {
                        return interaction.reply({ content: "❌ You are banned from using this bot. Use `/appeal` to appeal your ban.", ephemeral: true });
                    }
                }

                const { config } = RentoBot;
                
                const accessCheck = permissions.canExecuteCommand({
                    userID,
                    guildID: interaction.guildId,
                    channelID: interaction.channelId,
                    config,
                    isDM: !interaction.guildId
                });

                if (!accessCheck.allowed) {
                    return interaction.reply(permissions.formatDenialResponse(accessCheck.reason, true));
                }
                
                if (command.config.role === 2 && !config.bot.adminBot.includes(userID)) {
                    return interaction.reply({ content: "❌ This command is only for bot administrators.", ephemeral: true });
                }

                if (command.config.role === 1) {
                    if (interaction.guild) {
                        const member = interaction.guild.members.cache.get(userID);
                        if (!member.permissions.has('Administrator') && !guildData.adminIDs.includes(userID)) {
                            return interaction.reply({ content: "❌ This command requires administrator permissions.", ephemeral: true });
                        }
                    }
                }
                
                if (db.usersData && userData.userID) {
                    await db.usersData.set(userID, (userData.stats?.totalCommandsUsed || 0) + 1, 'stats.totalCommandsUsed').catch(() => {});
                }

                if (interaction.guildId && db.guildsData && guildData.guildID) {
                    await db.guildsData.set(guildID, (guildData.stats?.totalCommandsUsed || 0) + 1, 'stats.totalCommandsUsed').catch(() => {});
                }

                if (db.commandStatsData) {
                    await db.commandStatsData.incrementUsage(interaction.commandName).catch(() => {});
                }
                
                const parameters = {
                    interaction,
                    client,
                    usersData: db.usersData,
                    guildsData: db.guildsData,
                    db,
                    guildData,
                    userData,
                    prefix,
                    role,
                    getLang: (key, ...args) => context.getLang(command, key, ...args)
                };

                if (command.onSlash) {
                    await command.onSlash(parameters);
                } else if (command.onStart) {
                    await command.onStart(parameters);
                }
            }

            else if (interaction.isButton()) {
                log.info("INTERACTION", `${interaction.user.tag} clicked button: ${interaction.customId}`);
                
                const handler = RentoBot.onButton.get(interaction.customId);
                if (handler) {
                    await handler(interaction);
                } else {
                    const customIdParts = interaction.customId.split('_');
                    const potentialCommandName = customIdParts[0];
                    const command = RentoBot.commands.get(potentialCommandName.toLowerCase());
                    
                    if (command && typeof command.onButton === 'function') {
                        const context = await resolveInteractionContext(interaction);
                        const { guildData, userData, role, prefix } = context;
                        
                        const parameters = {
                            interaction,
                            client,
                            usersData: db.usersData,
                            guildsData: db.guildsData,
                            db,
                            guildData,
                            userData,
                            role,
                            prefix,
                            getLang: (key, ...args) => context.getLang(command, key, ...args)
                        };
                        
                        await command.onButton(parameters);
                    }
                }
            }

            else if (interaction.isStringSelectMenu()) {
                log.info("INTERACTION", `${interaction.user.tag} used select menu: ${interaction.customId}`);
                const handler = RentoBot.onSelectMenu.get(interaction.customId);
                if (handler) {
                    await handler(interaction);
                    RentoBot.onSelectMenu.delete(interaction.customId);
                }
            }

            else if (interaction.isModalSubmit()) {
                log.info("INTERACTION", `${interaction.user.tag} submitted modal: ${interaction.customId}`);
                const handler = RentoBot.onModal.get(interaction.customId);
                if (handler) {
                    await handler(interaction);
                    RentoBot.onModal.delete(interaction.customId);
                }
            }

        } catch (error) {
            log.error("INTERACTION", `Error handling interaction: ${error.message}`);
            console.error(error);
            
            const interactionType = interaction.type === InteractionType.ApplicationCommand ? 
                `Slash Command: ${interaction.commandName}` : 
                `Interaction: ${interaction.customId || 'Unknown'}`;
            
            errorNotifier.notifyError(error, {
                location: interactionType,
                command: interaction.commandName || interaction.customId || 'Unknown',
                user: interaction.user.tag
            }).catch(() => {});
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
            } else {
                await interaction.reply({ content: "❌ An error occurred while processing this interaction.", ephemeral: true });
            }
        }
    });
};
