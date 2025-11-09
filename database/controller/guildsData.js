const _ = require("lodash");
const { CustomError, TaskQueue, getType } = global.utils;

const taskQueue = new TaskQueue(function (task, callback) {
    if (getType(task) === "AsyncFunction") {
        task()
            .then(result => callback(null, result))
            .catch(err => callback(err));
    } else {
        try {
            const result = task();
            callback(null, result);
        } catch (err) {
            callback(err);
        }
    }
});

module.exports = async function (guildModel) {
    let Guilds = [];

    Guilds = (await guildModel.find({}).lean()).map(guild => _.omit(guild, ["_id", "__v"]));
    global.db.allGuildData = Guilds;

    async function save(guildID, guildData, mode) {
        try {
            let index = _.findIndex(global.db.allGuildData, { guildID });

            switch (mode) {
                case "create": {
                    let dataCreated = await guildModel.create(guildData);
                    dataCreated = _.omit(dataCreated._doc, ["_id", "__v"]);
                    global.db.allGuildData.push(dataCreated);
                    return _.cloneDeep(dataCreated);
                }
                case "update": {
                    if (index === -1) {
                        throw new CustomError({
                            name: "GUILD_NOT_FOUND",
                            message: `Can't find guild with guildID: ${guildID} in database`
                        });
                    }
                    let dataUpdated = await guildModel.findOneAndUpdate({ guildID }, guildData, { returnDocument: 'after' });
                    dataUpdated = _.omit(dataUpdated._doc, ["_id", "__v"]);
                    global.db.allGuildData[index] = dataUpdated;
                    return _.cloneDeep(dataUpdated);
                }
                default:
                    break;
            }
        } catch (err) {
            throw err;
        }
    }

    async function create(guildID, guildName = "") {
        // Verify bot is actually in this guild before creating data
        const client = global.RentoBot?.client;
        if (client) {
            const guild = client.guilds.cache.get(guildID);
            if (!guild) {
                // Bot is not in this guild, don't create data
                throw new CustomError({
                    name: "BOT_NOT_IN_GUILD",
                    message: `Bot is not a member of guild ${guildID}`
                });
            }
            if (!guildName) {
                guildName = guild.name || "";
            }
        }

        const guildData = {
            guildID: String(guildID),
            guildName: guildName,
            prefix: "!",
            adminIDs: [],
            settings: {
                welcomeChannel: null,
                welcomeEnabled: false,
                leaveChannel: null,
                leaveEnabled: false,
                levelUpChannel: null,
                levelUpEnabled: false
            },
            data: {
                aliases: {},
                welcomeMessage: "🎉 Welcome {userMention} to **{guildName}**! You are our **#{memberCount}** member. We're glad to have you here!",
                leaveMessage: "👋 **{userName}** has left **{guildName}**. We now have **{memberCount}** members. We'll miss you!",
                levelUpMessage: "🎊 Congratulations {userMention}! You've reached **Level {level}**! 🎉\n💎 Total XP: **{xp}**"
            },
            stats: {
                totalMembers: 0,
                totalMessages: 0,
                totalCommandsUsed: 0,
                joinedAt: null
            },
            banned: {
                status: false,
                reason: "",
                date: ""
            }
        };
        return await save(guildID, guildData, "create");
    }

    async function getName(guildID) {
        const guild = await get(guildID);
        if (guild.guildName) return guild.guildName;

        try {
            const client = global.RentoBot?.client;
            if (client) {
                const discordGuild = await client.guilds.fetch(guildID).catch(() => null);
                if (discordGuild) {
                    const name = discordGuild.name || "";
                    await set(guildID, { guildName: name });
                    return name;
                }
            }
        } catch (err) {
            console.error("Error fetching guild name:", err);
        }
        return guildID;
    }

    async function get(guildID) {
        const guild = global.db.allGuildData.find(g => g.guildID == guildID);
        if (!guild) {
            return await create(guildID);
        }
        return _.cloneDeep(guild);
    }

    async function set(guildID, updateData, path) {
        let guildData = await get(guildID);
        
        if (path) {
            _.set(guildData, path, updateData);
        } else {
            guildData = { ...guildData, ...updateData };
        }
        
        return await save(guildID, guildData, "update");
    }

    async function updateGuildInfo(guildID) {
        try {
            const client = global.RentoBot?.client;
            if (!client) return;

            const discordGuild = await client.guilds.fetch(guildID).catch(() => null);
            if (!discordGuild) return;

            const guildData = await get(guildID);

            if (!guildData.stats?.totalMembers || guildData.stats.totalMembers !== discordGuild.memberCount) {
                await set(guildID, discordGuild.memberCount || 0, 'stats.totalMembers');
            }

            if (!guildData.stats?.joinedAt) {
                const botMember = discordGuild.members.me;
                const joinedAt = botMember?.joinedAt ? botMember.joinedAt.toISOString() : new Date().toISOString();
                await set(guildID, joinedAt, 'stats.joinedAt');
            }

            if (!guildData.adminIDs || guildData.adminIDs.length === 0 || (guildData.adminIDs.length === 1 && guildData.adminIDs[0] === discordGuild.ownerId)) {
                const { PermissionFlagsBits, GatewayIntentBits } = require('discord.js');
                const adminIDs = new Set();
                
                adminIDs.add(discordGuild.ownerId);
                
                try {
                    // Try to fetch members with timeout
                    let members = null;
                    let fetchFailed = false;
                    
                    try {
                        members = await discordGuild.members.fetch({ 
                            limit: 1000,
                            timeout: 5000 
                        });
                    } catch (fetchError) {
                        fetchFailed = true;
                        // Check if we have cached members as fallback
                        if (discordGuild.members.cache.size > 0) {
                            members = discordGuild.members.cache;
                        }
                    }
                    
                    if (members && members.size > 0) {
                        members.forEach(member => {
                            if (!member.user.bot && member.permissions.has(PermissionFlagsBits.Administrator)) {
                                adminIDs.add(member.id);
                            }
                        });
                        
                        await set(guildID, { adminIDs: Array.from(adminIDs) });
                    } else if (fetchFailed) {
                        // Only log if fetch actually failed and we have no cached members
                        // Check if bot has proper intents
                        const hasGuildMembersIntent = client.options.intents.has(GatewayIntentBits.GuildMembers);
                        if (!hasGuildMembersIntent) {
                            console.warn(`[GUILD INFO] Could not fetch members for guild ${discordGuild.name} (${guildID}): Missing GUILD_MEMBERS intent. Enable it in Discord Developer Portal.`);
                        } else {
                            console.warn(`[GUILD INFO] Could not fetch members for guild ${discordGuild.name} (${guildID}). Using owner only. This may be due to rate limits or missing permissions.`);
                        }
                        // Save with owner only for now
                        await set(guildID, { adminIDs: Array.from(adminIDs) });
                    }
                } catch (err) {
                    console.error(`[GUILD INFO] Failed to detect admin members for guild ${guildID}:`, err.message);
                    // Save with owner only as fallback
                    await set(guildID, { adminIDs: Array.from(adminIDs) });
                }
            }

            if (!guildData.guildName || guildData.guildName === "") {
                await set(guildID, { guildName: discordGuild.name });
            }
        } catch (err) {
            console.error(`Error updating guild info for ${guildID}:`, err);
        }
    }

    return { create, get, set, save, getName, updateGuildInfo };
};
