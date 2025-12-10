const { EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const log = require('./log');
const permissions = require('../utils/permissions');

class ErrorNotifier {
    constructor() {
        this.recentErrors = new Map();
        this.rateLimitWindow = 60000;
        this.maxSameErrorsPerWindow = 3;
        this.initialized = false;
        this.client = null;
        this.config = null;
    }

    initialize(client, config) {
        this.client = client;
        this.config = config;
        this.initialized = true;
        log.success("ERROR_NOTIFIER", "Error notification system initialized");
    }

    isEnabled() {
        return this.config?.bot?.logErrorAdminChannels === true;
    }

    shouldNotify(errorSignature) {
        if (!this.isEnabled()) return false;
        
        // Send every error - no rate limiting
        return true;
    }

    formatError(error, context = {}) {
        const timezone = this.config?.bot?.timezone || "Asia/Kathmandu";
        const timestamp = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
        
        const errorType = error.name || "Error";
        const errorMessage = error.message || "Unknown error";
        
        const stack = error.stack || "";
        const stackLines = stack.split('\n').slice(0, 5);
        const truncatedStack = stackLines.join('\n');
        
        const location = context.location || this.extractLocation(stack);
        const command = context.command || "Unknown";
        const user = context.user || "Unknown";

        return {
            type: errorType,
            message: errorMessage,
            location,
            stack: truncatedStack,
            timestamp,
            command,
            user
        };
    }

    extractLocation(stack) {
        if (!stack) return "Unknown";
        
        const lines = stack.split('\n');
        for (let i = 1; i < lines.length && i < 4; i++) {
            const match = lines[i].match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
            if (match) {
                const [, func, file, line] = match;
                const filename = file.split('/').pop();
                return `${func} (${filename}:${line})`;
            }
            
            const simpleMatch = lines[i].match(/at\s+(.+):(\d+):(\d+)/);
            if (simpleMatch) {
                const [, file, line] = simpleMatch;
                const filename = file.split('/').pop();
                return `${filename}:${line}`;
            }
        }
        
        return "Unknown location";
    }

    createErrorEmbed(formattedError) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`🚨 ${formattedError.type}`)
            .setDescription(`\`\`\`${formattedError.message}\`\`\``)
            .addFields(
                { name: "📍 Location", value: `\`${formattedError.location}\``, inline: true },
                { name: "⏰ Time", value: `\`${formattedError.timestamp}\``, inline: true }
            )
            .setTimestamp();

        if (formattedError.command && formattedError.command !== "Unknown") {
            embed.addFields({ name: "🔧 Command", value: `\`${formattedError.command}\``, inline: true });
        }

        if (formattedError.user && formattedError.user !== "Unknown") {
            embed.addFields({ name: "👤 User", value: `\`${formattedError.user}\``, inline: true });
        }

        if (formattedError.stack) {
            const stackPreview = formattedError.stack.substring(0, 1000);
            embed.addFields({ name: "📚 Stack Trace (Preview)", value: `\`\`\`${stackPreview}\`\`\``, inline: false });
        }

        embed.setFooter({ text: "Production Error Log" });

        return embed;
    }

    async notifyAdminChannels(error, context = {}) {
        if (!this.initialized || !this.client) {
            return;
        }

        if (!this.isEnabled()) {
            return;
        }

        try {
            const errorSignature = `${error.name}:${error.message}:${context.location || ''}`;
            
            if (!this.shouldNotify(errorSignature)) {
                return;
            }

            const formattedError = this.formatError(error, context);
            const embed = this.createErrorEmbed(formattedError);

            const adminChannels = await permissions.getAccessibleAdminChannels(this.client, this.config);

            if (adminChannels.length === 0) {
                log.warn("ERROR_NOTIFIER", "No accessible admin channels found for error notification");
                return;
            }

            const sendPromises = adminChannels.map(channel => 
                channel.send({ embeds: [embed] })
                    .catch(err => {
                        log.error("ERROR_NOTIFIER", `Failed to send error to ${channel.name}: ${err.message}`);
                    })
            );

            await Promise.allSettled(sendPromises);
            
            log.info("ERROR_NOTIFIER", `Error notification sent to ${adminChannels.length} admin channel(s)`);
        } catch (notifyError) {
            log.error("ERROR_NOTIFIER", `Failed to notify admin channels: ${notifyError.message}`);
        }
    }

    async notifyError(error, context = {}) {
        await this.notifyAdminChannels(error, context);
    }

    clearOldErrors() {
        const now = Date.now();
        for (const [signature, data] of this.recentErrors.entries()) {
            if (now - data.firstOccurrence > this.rateLimitWindow * 2) {
                this.recentErrors.delete(signature);
            }
        }
    }

    startCleanupInterval() {
        setInterval(() => {
            this.clearOldErrors();
        }, this.rateLimitWindow);
    }
}

const errorNotifier = new ErrorNotifier();

module.exports = errorNotifier;
