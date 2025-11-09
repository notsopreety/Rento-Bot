const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Compare two version strings
 */
function compareVersion(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

module.exports = {
    config: {
        name: "update",
        aliases: ["updater", "checkupdate"],
        version: "1.0",
        author: "Samir",
        countDown: 5,
        role: 2, // Bot admin only
        description: {
            en: "Check for and install bot updates from GitHub",
            ne: "GitHub बाट बट अपडेट जाँच गर्नुहोस् र स्थापना गर्नुहोस्"
        },
        category: "admin",
        guide: {
            en: "{prefix}update",
            ne: "{prefix}update"
        },
        slash: true
    },

    langs: {
        en: {
            checking: "🔍 Checking for updates...",
            noUpdates: "✅ You are already on the latest version (**v%1**).",
            updateAvailable: "💫 Update Available!\n\n📦 **Current Version:** v%1\n⬆️ **Latest Version:** v%2\n\n📝 **Files to update:**\n%3%4\n\nℹ️ See details at: https://github.com/notsopreety/Rento-Bot/commits/main\n\n💡 React with ✅ to confirm update",
            fileWillDelete: "\n🗑️ **Files to delete:**\n%1",
            andMore: "\n...and %1 more files",
            updateConfirmed: "🚀 Update confirmed! Starting update process...",
            updateComplete: "✅ Update completed successfully!\n\n📦 **New Version:** v%1\n💾 **Backup:** %2\n\n🔄 Would you like to restart the bot now? (Reply with `yes` or `y` to restart)",
            updateTooFast: "⭕ Update too fast! Last commit was %1 minutes %2 seconds ago.\nPlease wait %3 minutes %4 seconds before updating to avoid errors.",
            botWillRestart: "🔄 Bot will restart now!",
            updateError: "❌ An error occurred during update: %1",
            checkingError: "❌ Failed to check for updates: %1"
        },
        ne: {
            checking: "🔍 अपडेट जाँच गर्दै...",
            noUpdates: "✅ तपाईं पहिले नै नवीनतम संस्करणमा हुनुहुन्छ (**v%1**)।",
            updateAvailable: "💫 अपडेट उपलब्ध छ!\n\n📦 **हालको संस्करण:** v%1\n⬆️ **नवीनतम संस्करण:** v%2\n\n📝 **अपडेट गर्नका लागि फाइलहरू:**\n%3%4\n\nℹ️ विवरण हेर्नुहोस्: https://github.com/notsopreety/Rento-Bot/commits/main\n\n💡 अपडेट पुष्टि गर्न ✅ प्रतिक्रिया दिनुहोस्",
            fileWillDelete: "\n🗑️ **मेटाउनका लागि फाइलहरू:**\n%1",
            andMore: "\n...र %1 थप फाइलहरू",
            updateConfirmed: "🚀 अपडेट पुष्टि भयो! अपडेट प्रक्रिया सुरु गर्दै...",
            updateComplete: "✅ अपडेट सफलतापूर्वक पूरा भयो!\n\n📦 **नयाँ संस्करण:** v%1\n💾 **ब्याकअप:** %2\n\n🔄 के तपाईं अहिले बट पुनः सुरु गर्न चाहनुहुन्छ? (पुनः सुरु गर्न `yes` वा `y` जवाफ दिनुहोस्)",
            updateTooFast: "⭕ अपडेट धेरै छिटो! अन्तिम कमिट %1 मिनेट %2 सेकेन्ड अघि थियो।\nत्रुटिहरूबाट बच्न %3 मिनेट %4 सेकेन्ड प्रतीक्षा गर्नुहोस्।",
            botWillRestart: "🔄 बट अहिले पुनः सुरु हुनेछ!",
            updateError: "❌ अपडेटको क्रममा त्रुटि देखा पर्यो: %1",
            checkingError: "❌ अपडेट जाँच गर्न असफल: %1"
        }
    },

    onStart: async ({ message, interaction, getLang }) => {
        const isSlash = !!interaction;
        const replyMethod = message ? message.reply.bind(message) : interaction.reply.bind(interaction);
        const editMethod = message ? null : interaction.editReply.bind(interaction);
        
        try {
            // Send checking message
            const checkingMsg = getLang("checking");
            const checkingResponse = isSlash 
                ? await interaction.reply({ content: checkingMsg, fetchReply: true })
                : await message.reply(checkingMsg);
            
            // Check for updates
            const currentVersion = require('../../package.json').version;
            
            // Get latest version from GitHub
            const { data: latestPackageJson } = await axios.get('https://raw.githubusercontent.com/notsopreety/Rento-Bot/main/package.json');
            const latestVersion = latestPackageJson.version;
            
            // Compare versions
            const comparison = compareVersion(latestVersion, currentVersion);
            
            if (comparison <= 0) {
                const response = getLang("noUpdates", currentVersion);
                if (isSlash && checkingResponse) {
                    await checkingResponse.edit(response);
                } else {
                    await replyMethod(response);
                }
                return;
            }
            
            // Get versions.json to see what files will be updated
            const { data: versions } = await axios.get('https://raw.githubusercontent.com/notsopreety/Rento-Bot/main/versions.json');
            const currentVersionIndex = versions.findIndex(v => v.version === currentVersion);
            const versionsToUpdate = currentVersionIndex === -1 
                ? versions 
                : versions.slice(currentVersionIndex + 1);
            
            // Get list of files to update
            let filesToUpdate = [];
            let filesToDelete = [];
            
            for (const version of versionsToUpdate) {
                if (version.files) {
                    filesToUpdate.push(...Object.keys(version.files));
                }
                if (version.deleteFiles) {
                    filesToDelete.push(...Object.keys(version.deleteFiles));
                }
            }
            
            filesToUpdate = [...new Set(filesToUpdate)].sort();
            filesToDelete = [...new Set(filesToDelete)].sort();
            
            const filesList = filesToUpdate.slice(0, 15).map(f => ` - ${f}`).join('\n');
            const filesListMore = filesToUpdate.length > 15 ? getLang("andMore", filesToUpdate.length - 15) : '';
            
            const deleteList = filesToDelete.length > 0 
                ? filesToDelete.slice(0, 10).map(f => ` - ${f}`).join('\n')
                : '';
            const deleteListMore = filesToDelete.length > 10 ? getLang("andMore", filesToDelete.length - 10) : '';
            
            const updatePrompt = getLang(
                "updateAvailable",
                currentVersion,
                latestVersion,
                filesList + filesListMore,
                deleteList ? getLang("fileWillDelete", deleteList + deleteListMore) : ""
            );
            
            const embed = new EmbedBuilder()
                .setTitle("🔄 Bot Update Available")
                .setDescription(updatePrompt)
                .setColor(0xFFA500)
                .setTimestamp()
                .setFooter({ text: "React with ✅ to confirm update" });
            
            const confirmButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`update_confirm_${message?.author?.id || interaction.user.id}`)
                        .setLabel('✅ Confirm Update')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`update_cancel_${message?.author?.id || interaction.user.id}`)
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Danger)
                );
            
            const updateMessage = isSlash && checkingResponse
                ? await checkingResponse.edit({ embeds: [embed], components: [confirmButton] })
                : await replyMethod({ embeds: [embed], components: [confirmButton] });
            
            // Store update info for button handler
            const messageId = isSlash ? updateMessage.id : updateMessage.id || checkingResponse.id;
            const userId = message?.author?.id || interaction.user.id;
            
            global.RentoBot.onButton.set(`update_confirm_${userId}`, async (btnInteraction) => {
                if (btnInteraction.user.id !== userId) {
                    return btnInteraction.reply({
                        content: "❌ Only the user who requested the update can confirm it!",
                        ephemeral: true
                    });
                }
                await handleUpdate(btnInteraction, getLang, currentVersion, latestVersion);
            });
            
        } catch (error) {
            const errorMsg = getLang("checkingError", error.message);
            if (isSlash) {
                await interaction.editReply(errorMsg);
            } else {
                await replyMethod(errorMsg);
            }
            console.error('[UPDATE] Error:', error);
        }
    },

    onButton: async ({ interaction, getLang }) => {
        const customId = interaction.customId;
        
        if (customId.startsWith('update_confirm_')) {
            const userId = customId.split('_')[2];
            
            if (interaction.user.id !== userId) {
                return interaction.reply({
                    content: "❌ Only the user who requested the update can confirm it!",
                    ephemeral: true
                });
            }
            
            // Get current and latest version
            const currentVersion = require('../../package.json').version;
            const { data: latestPackageJson } = await axios.get('https://raw.githubusercontent.com/notsopreety/Rento-Bot/main/package.json');
            const latestVersion = latestPackageJson.version;
            
            await handleUpdate(interaction, getLang, currentVersion, latestVersion);
        } else if (customId.startsWith('update_cancel_')) {
            await interaction.update({
                content: "❌ Update cancelled.",
                embeds: [],
                components: []
            });
        }
    }
};

async function handleUpdate(interaction, getLang, currentVersion, latestVersion) {
    try {
        await interaction.update({ content: getLang("updateConfirmed"), embeds: [], components: [] });
        
        // Check commit cooldown
        try {
            const { data: commits } = await axios.get('https://api.github.com/repos/notsopreety/Rento-Bot/commits/main', {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });
            
            if (commits && commits.length > 0) {
                const lastCommit = commits[0];
                const lastCommitDate = new Date(lastCommit.commit.committer.date);
                const timeDiff = Date.now() - lastCommitDate.getTime();
                const cooldownTime = 5 * 60 * 1000; // 5 minutes
                
                if (timeDiff < cooldownTime) {
                    const minutes = Math.floor(timeDiff / 1000 / 60);
                    const seconds = Math.floor((timeDiff / 1000) % 60);
                    const minutesLeft = Math.floor((cooldownTime - timeDiff) / 1000 / 60);
                    const secondsLeft = Math.floor(((cooldownTime - timeDiff) / 1000) % 60);
                    
                    return interaction.followUp({
                        content: getLang("updateTooFast", minutes, seconds, minutesLeft, secondsLeft),
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            // Continue if cooldown check fails
            console.warn('[UPDATE] Cooldown check failed:', error.message);
        }
        
        // Run updater
        const updaterPath = path.join(process.cwd(), 'updater.js');
        
        if (!fs.existsSync(updaterPath)) {
            throw new Error('updater.js not found');
        }
        
        // Execute updater
        execSync('node updater.js', {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        // Get updated version
        const updatedPackageJson = require('../../package.json');
        const newVersion = updatedPackageJson.version;
        
        // Find backup folder
        const backupsPath = path.join(process.cwd(), 'backups');
        let backupFolder = 'backups/';
        
        if (fs.existsSync(backupsPath)) {
            const backups = fs.readdirSync(backupsPath)
                .filter(f => f.startsWith('backup_'))
                .sort()
                .reverse();
            
            if (backups.length > 0) {
                backupFolder = `backups/${backups[0]}`;
            }
        }
        
        const completeMsg = getLang("updateComplete", newVersion, backupFolder);
        
        const restartButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`restart_confirm_${interaction.user.id}`)
                    .setLabel('🔄 Restart Bot')
                    .setStyle(ButtonStyle.Primary)
            );
        
        const completeMessage = await interaction.followUp({
            content: completeMsg,
            components: [restartButton]
        });
        
        // Store restart handler
        global.RentoBot.onButton.set(`restart_confirm_${interaction.user.id}`, async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({
                    content: "❌ Only the user who initiated the update can restart the bot!",
                    ephemeral: true
                });
            }
            
            await btnInteraction.update({
                content: getLang("botWillRestart"),
                components: []
            });
            
            // Exit with code 2 to trigger restart
            process.exit(2);
        });
        
    } catch (error) {
        const errorMsg = getLang("updateError", error.message);
        await interaction.followUp({
            content: errorMsg,
            ephemeral: true
        });
        console.error('[UPDATE] Update error:', error);
    }
}

