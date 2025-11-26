
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    config: {
        name: "nsfw",
        aliases: ["nsfwconfig"],
        version: "1.0",
        author: "Samir",
        countDown: 5,
        role: 1,
        description: {
            en: "Enable or disable NSFW content in the server",
            ne: "सर्भरमा NSFW सामग्री सक्षम वा अक्षम गर्नुहोस्"
        },
        category: "config",
        guide: {
            en: "{prefix}nsfw <on/off> - Toggle NSFW content",
            ne: "{prefix}nsfw <on/off> - NSFW सामग्री टगल गर्नुहोस्"
        },
        slash: true,
        options: [
            {
                name: "status",
                description: "Enable or disable NSFW content",
                type: 3,
                required: true,
                choices: [
                    { name: "Enable", value: "on" },
                    { name: "Disable", value: "off" }
                ]
            }
        ]
    },

    langs: {
        en: {
            nsfwEnabled: "✅ NSFW content has been **enabled** for this server.",
            nsfwDisabled: "❌ NSFW content has been **disabled** for this server.",
            invalidOption: "❌ Invalid option! Use `on` or `off`.",
            noPermission: "❌ You need to be a server moderator to use this command!"
        },
        ne: {
            nsfwEnabled: "✅ यो सर्भरको लागि NSFW सामग्री **सक्षम** गरिएको छ।",
            nsfwDisabled: "❌ यो सर्भरको लागि NSFW सामग्री **अक्षम** गरिएको छ।",
            invalidOption: "❌ अवैध विकल्प! `on` वा `off` प्रयोग गर्नुहोस्।",
            noPermission: "❌ यो आदेश प्रयोग गर्न तपाईं सर्भर मोडरेटर हुनुपर्छ!"
        }
    },

    onStart: async ({ message, interaction, args, guildData, guildsData, getLang }) => {
        const isInteraction = !!interaction;
        const member = isInteraction ? interaction.member : message.member;

        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(getLang("noPermission"));
            return isInteraction ? interaction.reply({ embeds: [embed], flags: [4096] }) : message.reply({ embeds: [embed] });
        }

        const status = isInteraction ? interaction.options.getString("status") : args[0]?.toLowerCase();

        if (!status || !["on", "off"].includes(status)) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(getLang("invalidOption"));
            return isInteraction ? interaction.reply({ embeds: [embed], flags: [4096] }) : message.reply({ embeds: [embed] });
        }

        const enabled = status === "on";
        await guildsData.set(guildData.guildID, enabled, "settings.nsfwEnabled");

        const embed = new EmbedBuilder()
            .setColor(enabled ? 0x00ff00 : 0xff0000)
            .setDescription(enabled ? getLang("nsfwEnabled") : getLang("nsfwDisabled"))
            .setTimestamp();

        return isInteraction ? interaction.reply({ embeds: [embed] }) : message.reply({ embeds: [embed] });
    }
};
