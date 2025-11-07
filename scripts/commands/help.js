const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    config: {
        name: "help",
        version: "1.22",
        author: "Samir",
        countDown: 5,
        role: 0,
        description: {
            en: "View command usage",
            ne: "कमाण्ड प्रयोग हेर्नुहोस्"
        },
        category: "info",
        guide: {
            en: "{pn} [empty | <page number> | <command name>]"
                + "\n   {pn} <command name> [-u | usage | -g | guide]: only show command usage"
                + "\n   {pn} <command name> [-i | info]: only show command info"
                + "\n   {pn} <command name> [-r | role]: only show command role"
                + "\n   {pn} <command name> [-a | alias]: only show command alias",
            ne: "{pn} [खाली | <पृष्ठ नम्बर> | <कमाण्ड नाम>]"
                + "\n   {pn} <कमाण्ड नाम> [-u | usage | -g | guide]: कमाण्ड प्रयोग मात्र देखाउनुहोस्"
                + "\n   {pn} <कमाण्ड नाम> [-i | info]: कमाण्ड जानकारी मात्र देखाउनुहोस्"
                + "\n   {pn} <कमाण्ड नाम> [-r | role]: कमाण्ड भूमिका मात्र देखाउनुहोस्"
                + "\n   {pn} <कमाण्ड नाम> [-a | alias]: कमाण्ड उपनाम मात्र देखाउनुहोस्"
        },
        slash: true,
        options: [
            {
                name: "command",
                description: "The command to get help for (or page number)",
                type: 3,
                required: false
            },
            {
                name: "option",
                description: "Additional options (-u, -i, -r, -a)",
                type: 3,
                required: false
            }
        ]
    },

    langs: {
        en: {
            help: "**Command List**"
                + "\n%1"
                + "\n\n**Page [ %2/%3 ]**"
                + "\nCurrently, the bot has **%4** commands that can be used"
                + "\n» Type `%5help <page>` to view the command list"
                + "\n» Type `%5help <command>` to view the details of how to use that command",
            help2: "**Command List**"
                + "\n%1"
                + "\n\nCurrently, the bot has **%2** commands that can be used"
                + "\n» Type `%3help <command name>` to view the details of how to use that command",
            commandNotFound: "Command \"%1\" does not exist",
            getInfoCommand: "**📖 NAME**"
                + "\n%1"
                + "\n\n**ℹ️ INFO**"
                + "\n• Description: %2"
                + "\n• Other names: %3"
                + "\n• Version: %4"
                + "\n• Role: %5"
                + "\n• Time per command: %6s"
                + "\n• Author: %7"
                + "\n\n**📝 USAGE**"
                + "\n%8"
                + "\n\n**📌 NOTES**"
                + "\nThe content inside <XXXXX> can be changed"
                + "\nThe content inside [a|b|c] is a or b or c",
            onlyInfo: "**ℹ️ INFO**"
                + "\n• Command name: %1"
                + "\n• Description: %2"
                + "\n• Other names: %3"
                + "\n• Version: %4"
                + "\n• Role: %5"
                + "\n• Time per command: %6s"
                + "\n• Author: %7",
            onlyUsage: "**📝 USAGE**"
                + "\n%1",
            onlyAlias: "**🔖 ALIAS**"
                + "\n• Other names: %1",
            onlyRole: "**👥 ROLE**"
                + "\n%1",
            doNotHave: "Do not have",
            roleText0: "0 (All users)",
            roleText1: "1 (Guild administrators)",
            roleText2: "2 (Admin bot)",
            pageNotFound: "Page %1 does not exist"
        },
        ne: {
            help: "**कमाण्ड सूची**"
                + "\n%1"
                + "\n\n**पृष्ठ [ %2/%3 ]**"
                + "\nहाल, बटसँग **%4** कमाण्डहरू प्रयोग गर्न सकिन्छ"
                + "\n» कमाण्ड सूची हेर्न `%5help <पृष्ठ>` टाइप गर्नुहोस्"
                + "\n» कमाण्ड प्रयोग गर्ने विवरण हेर्न `%5help <कमाण्ड>` टाइप गर्नुहोस्",
            help2: "**कमाण्ड सूची**"
                + "\n%1"
                + "\n\nहाल, बटसँग **%2** कमाण्डहरू प्रयोग गर्न सकिन्छ"
                + "\n» कमाण्ड प्रयोग गर्ने विवरण हेर्न `%3help <कमाण्ड नाम>` टाइप गर्नुहोस्",
            commandNotFound: "कमाण्ड \"%1\" अवस्थित छैन",
            getInfoCommand: "**📖 नाम**"
                + "\n%1"
                + "\n\n**ℹ️ जानकारी**"
                + "\n• विवरण: %2"
                + "\n• अन्य नामहरू: %3"
                + "\n• संस्करण: %4"
                + "\n• भूमिका: %5"
                + "\n• कमाण्ड प्रति समय: %6s"
                + "\n• लेखक: %7"
                + "\n\n**📝 प्रयोग**"
                + "\n%8"
                + "\n\n**📌 नोटहरू**"
                + "\n<XXXXX> भित्रको सामग्री परिवर्तन गर्न सकिन्छ"
                + "\n[a|b|c] भित्रको सामग्री a वा b वा c हो",
            onlyInfo: "**ℹ️ जानकारी**"
                + "\n• कमाण्ड नाम: %1"
                + "\n• विवरण: %2"
                + "\n• अन्य नामहरू: %3"
                + "\n• संस्करण: %4"
                + "\n• भूमिका: %5"
                + "\n• कमाण्ड प्रति समय: %6s"
                + "\n• लेखक: %7",
            onlyUsage: "**📝 प्रयोग**"
                + "\n%1",
            onlyAlias: "**🔖 उपनाम**"
                + "\n• अन्य नामहरू: %1",
            onlyRole: "**👥 भूमिका**"
                + "\n%1",
            doNotHave: "छैन",
            roleText0: "0 (सबै प्रयोगकर्ताहरू)",
            roleText1: "1 (गिल्ड प्रशासकहरू)",
            roleText2: "2 (प्रशासक बट)",
            pageNotFound: "पृष्ठ %1 अवस्थित छैन"
        }
    },

    onStart: async function ({ message, interaction, args, usersData, getLang, role, prefix, event }) {
        const isSlash = !!interaction;
        const userID = isSlash ? interaction.user.id : event.author.id;
        const userData = await usersData.get(userID);
        
        let sortHelp = userData.settings?.sortHelp || "name";
        if (!["category", "name"].includes(sortHelp))
            sortHelp = "name";

        const userLang = userData.settings?.language || "en";

        const commands = global.RentoBot.commands;
        const aliases = global.RentoBot.aliases;
        const CLIENT_ID = global.RentoBot.config.discord.clientId;
        
        const commandArg = isSlash ? interaction.options.getString('command') : args[0];
        const optionArg = isSlash ? interaction.options.getString('option') : args[1];
        
        const commandName = (commandArg || "").toLowerCase();
        let command = commands.get(commandName) || commands.get(aliases.get(commandName));

        if (!command && !commandArg || !isNaN(commandArg)) {
            const arrayInfo = [];
            let description = "";
            
            if (sortHelp == "name") {
                const page = parseInt(commandArg) || 1;
                const numberOfOnePage = 20;
                
                for (const [name, value] of commands) {
                    if (value.config.role > 1 && role < value.config.role)
                        continue;
                    
                    let describe = name;
                    let desc = value.config.description?.[userLang] || value.config.description?.en || "";
                    if (desc) {
                        describe += `: ${desc.charAt(0).toUpperCase() + desc.slice(1)}`;
                        if (describe.length > 80) describe = describe.substring(0, 77) + "...";
                    }
                    
                    arrayInfo.push({
                        data: describe,
                        priority: value.priority || 0
                    });
                }

                arrayInfo.sort((a, b) => a.data.localeCompare(b.data));
                arrayInfo.sort((a, b) => b.priority - a.priority);
                
                const totalPage = Math.ceil(arrayInfo.length / numberOfOnePage);
                
                if (page < 1 || page > totalPage) {
                    const response = getLang("pageNotFound", page);
                    return isSlash ? interaction.reply(response) : message.reply(response);
                }

                const startIndex = (page - 1) * numberOfOnePage;
                const endIndex = startIndex + numberOfOnePage;
                const returnArray = arrayInfo.slice(startIndex, endIndex);
                
                description = returnArray.map((item, index) => {
                    const num = startIndex + index + 1;
                    return `**${num}.** ${item.data}`;
                }).join("\n");

                const embed = new EmbedBuilder()
                    .setTitle("📚 Help Menu")
                    .setDescription(getLang("help", description, page, totalPage, commands.size, prefix))
                    .setColor(0x00AE86)
                    .setFooter({ text: `Use ${prefix}sorthelp to change display style` })
                    .setTimestamp();

                const rows = [];
                const navigationRow = new ActionRowBuilder();
                
                if (page > 1) {
                    navigationRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`help_prev_${page}_${userID}`)
                            .setLabel('◀️ Previous')
                            .setStyle(ButtonStyle.Primary)
                    );
                }
                
                if (page < totalPage) {
                    navigationRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`help_next_${page}_${userID}`)
                            .setLabel('Next ▶️')
                            .setStyle(ButtonStyle.Primary)
                    );
                }

                if (navigationRow.components.length > 0) rows.push(navigationRow);

                const linksRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Invite Bot')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
                            .setEmoji('🤖'),
                        new ButtonBuilder()
                            .setLabel('Website')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://rento.samirb.com.np/')
                            .setEmoji('🌐'),
                        new ButtonBuilder()
                            .setLabel('GitHub')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://github.com/notsopreety/Rento-Bot')
                            .setEmoji('💻'),
                        new ButtonBuilder()
                            .setLabel('Author')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://samirbadaila.is-a.dev')
                            .setEmoji('🧑‍💻')
                    );

                rows.push(linksRow);

                const messageOptions = { embeds: [embed], components: rows };

                return isSlash ? interaction.reply(messageOptions) : message.reply(messageOptions);
            }
            else if (sortHelp == "category") {
                const categoryMap = {};
                
                for (const [, value] of commands) {
                    if (value.config.role > 1 && role < value.config.role)
                        continue;
                    
                    const category = (value.config.category || "other").toLowerCase();
                    if (!categoryMap[category]) categoryMap[category] = [];
                    categoryMap[category].push(value.config.name);
                }

                const sortedCategories = Object.keys(categoryMap).sort();
                
                for (const category of sortedCategories) {
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                    const commandList = categoryMap[category].sort().map(c => `\`${c}\``).join(", ");
                    description += `\n\n**📁 ${categoryName}**\n${commandList}`;
                }

                const embed = new EmbedBuilder()
                    .setTitle("📚 Help Menu")
                    .setDescription(getLang("help2", description.trim(), commands.size, prefix))
                    .setColor(0x00AE86)
                    .setFooter({ text: `Use ${prefix}sorthelp to change display style` })
                    .setTimestamp();

                const linksRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Invite Bot')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
                            .setEmoji('🤖'),
                        new ButtonBuilder()
                            .setLabel('Website')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://rento.samirb.com.np/')
                            .setEmoji('🌐'),
                        new ButtonBuilder()
                            .setLabel('GitHub')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://github.com/notsopreety/Rento-Bot')
                            .setEmoji('💻'),
                        new ButtonBuilder()
                            .setLabel('Author')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://samirbadaila.is-a.dev')
                            .setEmoji('🧑‍💻')
                    );

                return isSlash ? interaction.reply({ embeds: [embed], components: [linksRow] }) : message.reply({ embeds: [embed], components: [linksRow] });
            }
        }
        else if (!command && commandArg) {
            const response = getLang("commandNotFound", commandArg);
            return isSlash ? interaction.reply(response) : message.reply(response);
        }
        else {
            const configCommand = command.config;
            
            let guide = configCommand.guide?.[userLang] || configCommand.guide?.en || "";
            if (typeof guide == "string") {
                guide = guide
                    .replace(/\{prefix\}|\{p\}/g, prefix)
                    .replace(/\{name\}|\{n\}/g, configCommand.name)
                    .replace(/\{pn\}/g, prefix + configCommand.name);
            }

            const aliasesString = configCommand.aliases ? configCommand.aliases.join(", ") : getLang("doNotHave");
            
            const roleText = configCommand.role == 0 ? getLang("roleText0") :
                           configCommand.role == 1 ? getLang("roleText1") : getLang("roleText2");

            const description = configCommand.description?.[userLang] || configCommand.description?.en || getLang("doNotHave");
            const author = configCommand.author || "";

            let formSendMessage = {};

            if (optionArg?.match(/^-g|guide|-u|usage$/)) {
                formSendMessage.body = getLang("onlyUsage", guide);
            }
            else if (optionArg?.match(/^-a|alias|aliase|aliases$/)) {
                formSendMessage.body = getLang("onlyAlias", aliasesString);
            }
            else if (optionArg?.match(/^-r|role$/)) {
                formSendMessage.body = getLang("onlyRole", roleText);
            }
            else if (optionArg?.match(/^-i|info$/)) {
                formSendMessage.body = getLang(
                    "onlyInfo",
                    configCommand.name,
                    description,
                    aliasesString,
                    configCommand.version,
                    roleText,
                    configCommand.countDown || 1,
                    author
                );
            }
            else {
                formSendMessage.body = getLang(
                    "getInfoCommand",
                    configCommand.name,
                    description,
                    aliasesString,
                    configCommand.version,
                    roleText,
                    configCommand.countDown || 1,
                    author,
                    guide
                );
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 ${configCommand.name}`)
                .setDescription(formSendMessage.body)
                .setColor(0x00AE86)
                .setTimestamp();

            const linksRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Invite Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
                        .setEmoji('🤖'),
                    new ButtonBuilder()
                        .setLabel('Website')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://rento.samirb.com.np/')
                        .setEmoji('🌐'),
                    new ButtonBuilder()
                        .setLabel('GitHub')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://github.com/notsopreety/Rento-Bot')
                        .setEmoji('💻'),
                    new ButtonBuilder()
                        .setLabel('Author')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://samirbadaila.is-a.dev')
                        .setEmoji('🧑‍💻')
                );

            return isSlash ? interaction.reply({ embeds: [embed], components: [linksRow] }) : message.reply({ embeds: [embed], components: [linksRow] });
        }
    },

    onButton: async ({ interaction, usersData, getLang, role, prefix }) => {
        const parts = interaction.customId.split('_');
        const [action, type, currentPage, authorizedUserID] = parts;
        
        if (action !== 'help') return;
        
        if (interaction.user.id !== authorizedUserID) {
            return interaction.reply({ 
                content: "❌ Only the user who requested the help menu can use these buttons!", 
                ephemeral: true 
            });
        }
        
        const page = type === 'next' ? parseInt(currentPage) + 1 : parseInt(currentPage) - 1;
        const userID = interaction.user.id;
        const userData = await usersData.get(userID);
        
        let sortHelp = userData.settings?.sortHelp || "name";
        if (!["category", "name"].includes(sortHelp))
            sortHelp = "name";

        const userLang = userData.settings?.language || "en";

        const commands = global.RentoBot.commands;
        const arrayInfo = [];
        const numberOfOnePage = 20;
        
        for (const [name, value] of commands) {
            if (value.config.role > 1 && role < value.config.role)
                continue;
            
            let describe = name;
            let desc = value.config.description?.[userLang] || value.config.description?.en || "";
            if (desc) {
                describe += `: ${desc.charAt(0).toUpperCase() + desc.slice(1)}`;
                if (describe.length > 80) describe = describe.substring(0, 77) + "...";
            }
            
            arrayInfo.push({
                data: describe,
                priority: value.priority || 0
            });
        }

        arrayInfo.sort((a, b) => a.data.localeCompare(b.data));
        arrayInfo.sort((a, b) => b.priority - a.priority);
        
        const totalPage = Math.ceil(arrayInfo.length / numberOfOnePage);
        const startIndex = (page - 1) * numberOfOnePage;
        const endIndex = startIndex + numberOfOnePage;
        const returnArray = arrayInfo.slice(startIndex, endIndex);
        
        const description = returnArray.map((item, index) => {
            const num = startIndex + index + 1;
            return `**${num}.** ${item.data}`;
        }).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("📚 Help Menu")
            .setDescription(getLang("help", description, page, totalPage, commands.size, prefix))
            .setColor(0x00AE86)
            .setFooter({ text: `Use ${prefix}sorthelp to change display style` })
            .setTimestamp();

        const rows = [];
        const navigationRow = new ActionRowBuilder();
        
        if (page > 1) {
            navigationRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`help_prev_${page}_${userID}`)
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary)
            );
        }
        
        if (page < totalPage) {
            navigationRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`help_next_${page}_${userID}`)
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        if (navigationRow.components.length > 0) rows.push(navigationRow);

        const linksRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://rento.samirb.com.np/')
                    .setEmoji('🌐'),
                new ButtonBuilder()
                    .setLabel('GitHub')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/notsopreety/Rento-Bot')
                    .setEmoji('💻'),
                new ButtonBuilder()
                    .setLabel('Author')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://samirbadaila.is-a.dev')
                    .setEmoji('🧑‍💻')
            );

        rows.push(linksRow);

        const messageOptions = { embeds: [embed], components: rows };

        await interaction.update(messageOptions);
    }
};
