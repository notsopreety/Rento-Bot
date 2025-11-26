const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildID: { type: String, required: true, unique: true },
    guildName: { type: String, default: "" },
    prefix: { type: String, default: "!" },
    adminIDs: { type: Array, default: [] },
    settings: {
        type: Object,
        default: {
            welcomeChannel: null,
            welcomeEnabled: false,
            leaveChannel: null,
            leaveEnabled: false,
            levelUpChannel: null,
            levelUpEnabled: false,
            nsfwEnabled: false
        }
    },
    data: {
        type: Object,
        default: {
            aliases: {},
            welcomeMessage: "",
            leaveMessage: "",
            levelUpMessage: ""
        }
    },
    stats: {
        type: Object,
        default: {
            totalMembers: 0,
            totalMessages: 0,
            totalCommandsUsed: 0,
            joinedAt: null
        }
    },
    banned: {
        status: { type: Boolean, default: false },
        reason: { type: String, default: "" },
        date: { type: String, default: "" }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Guild', guildSchema);
