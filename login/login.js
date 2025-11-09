
process.stdout.write("\x1b]2;Discord Bot - inspired by Goat-Bot-V2\x1b\x5c");

const gradient = require("gradient-string").default || require("gradient-string");
const fs = require("fs-extra");
const path = require("path");
const { Client } = require('discord.js');
const { execSync } = require('child_process');
const ora = require('ora');

const currentVersion = require(`${process.cwd()}/package.json`).version;

function centerText(text, length) {
    const width = process.stdout.columns;
    const leftPadding = Math.floor((width - (length || text.length)) / 2);
    const rightPadding = width - leftPadding - (length || text.length);
    const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
    console.log(paddedString);
}

const titles = [
    [
        "██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗     ██████╗  ██████╗ ████████╗",
        "██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝",
        "██║  ██║██║███████╗██║     ██║   ██║██████╔╝██║  ██║    ██████╔╝██║   ██║   ██║   ",
        "██║  ██║██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║    ██╔══██╗██║   ██║   ██║   ",
        "██████╔╝██║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝    ██████╔╝╚██████╔╝   ██║   ",
        "╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   "
    ],
    [
        "█▀▄ █ █▀ █▀▀ █▀█ █▀█ █▀▄   █▄▄ █▀█ ▀█▀",
        "█▄▀ █ ▄█ █▄▄ █▄█ █▀▄ █▄▀   █▄█ █▄█ ░█░"
    ],
    [
        "DISCORD BOT V" + currentVersion
    ],
    [
        "BOT"
    ]
];

function createLine(content, isMaxWidth = false) {
    const widthConsole = process.stdout.columns > 50 ? 50 : process.stdout.columns;
    if (!content)
        return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill("─").join("");
    else {
        content = ` ${content.trim()} `;
        const lengthContent = content.length;
        const lengthLine = isMaxWidth ? process.stdout.columns - lengthContent : widthConsole - lengthContent;
        let left = Math.floor(lengthLine / 2);
        if (left < 0 || isNaN(left))
            left = 0;
        const lineOne = Array(left).fill("─").join("");
        return lineOne + content + lineOne;
    }
}

function displayBanner() {
    const maxWidth = process.stdout.columns;
    const title = maxWidth > 85 ?
        titles[0] :
        maxWidth > 36 ?
            titles[1] :
            maxWidth > 26 ?
                titles[2] :
                titles[3];

    console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
    console.log();
    for (const text of title) {
        const textColor = gradient("#FA8BFF", "#2BD2FF", "#2BFF88")(text);
        centerText(textColor, text.length);
    }
    
    let subTitle = `Discord Bot V${currentVersion} - A powerful modular Discord bot`;
    const subTitleArray = [];
    if (subTitle.length > maxWidth) {
        while (subTitle.length > maxWidth) {
            let lastSpace = subTitle.slice(0, maxWidth).lastIndexOf(' ');
            lastSpace = lastSpace == -1 ? maxWidth : lastSpace;
            subTitleArray.push(subTitle.slice(0, lastSpace).trim());
            subTitle = subTitle.slice(lastSpace).trim();
        }
        subTitle ? subTitleArray.push(subTitle) : '';
    }
    else {
        subTitleArray.push(subTitle);
    }
    
    const author = ("Created with ♡ | Samir Badaila");
    const srcUrl = ("Source: https://github.com/notsopreety/Rento-Bot");
    
    for (const t of subTitleArray) {
        const textColor2 = gradient("#9F98E8", "#AFF6CF")(t);
        centerText(textColor2, t.length);
    }
    centerText(gradient("#9F98E8", "#AFF6CF")(author), author.length);
    centerText(gradient("#9F98E8", "#AFF6CF")(srcUrl), srcUrl.length);
    console.log();
    console.log(gradient("#f5af19", "#f12711")(createLine(null, true)));
    console.log();
}

function scanAllPackages() {
    const regExpCheckPackage = /require\s*\(\s*[`'"]([^`'"]+)[`'"]\s*\)/g;
    const allPackages = new Set();
    
    // Node.js built-in modules to exclude
    const builtInModules = new Set([
        'fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'stream',
        'events', 'child_process', 'cluster', 'dgram', 'dns', 'net',
        'readline', 'repl', 'tls', 'tty', 'url', 'v8', 'vm', 'zlib',
        'assert', 'buffer', 'constants', 'domain', 'module', 'process',
        'querystring', 'string_decoder', 'sys', 'timers', 'punycode'
    ]);
    
    const dirsToScan = [
        'handlers',
        'scripts/commands',
        'scripts/events',
        'login',
        'logger',
        'database',
        'utils',
        'dashboard'
    ];
    
    const filesToScan = [
        'Bot.js',
        'index.js',
        'loadConfig.js',
        'utils.js'
    ];
    
    function scanFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) return;
            
            const content = fs.readFileSync(filePath, 'utf8');
            let matches = content.match(regExpCheckPackage);
            
            if (matches) {
                matches.forEach(match => {
                    const pkgMatch = match.match(/[`'"]([^`'"]+)[`'"]/);
                    if (pkgMatch && pkgMatch[1]) {
                        let packageName = pkgMatch[1];
                        
                        // Skip relative imports
                        if (packageName.startsWith('./') || packageName.startsWith('../') || packageName.startsWith('/')) {
                            return;
                        }
                        
                        // Skip if contains variables or template syntax
                        if (packageName.includes('$') || packageName.includes('{') || packageName.includes('}')) {
                            return;
                        }
                        
                        // Handle scoped packages
                        if (packageName.startsWith('@')) {
                            packageName = packageName.split('/').slice(0, 2).join('/');
                        } else {
                            packageName = packageName.split('/')[0];
                        }
                        
                        // Skip built-in Node.js modules
                        if (builtInModules.has(packageName)) {
                            return;
                        }
                        
                        // Skip if package name looks invalid
                        if (packageName.length === 0 || packageName.length > 214) {
                            return;
                        }
                        
                        allPackages.add(packageName);
                    }
                });
            }
        } catch (error) {
            // Skip files that can't be read
        }
    }
    
    function scanDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) return;
            
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.js') && !item.endsWith('.eg.js')) {
                    scanFile(fullPath);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
    }
    
    // Scan individual files
    for (const file of filesToScan) {
        scanFile(path.join(process.cwd(), file));
    }
    
    // Scan directories
    for (const dir of dirsToScan) {
        scanDirectory(path.join(process.cwd(), dir));
    }
    
    return Array.from(allPackages).filter(pkg => pkg && pkg.length > 0);
}

async function checkPackages() {
    const log = require('../logger/log.js');
    
    console.log(gradient("#FF6B6B", "#4ECDC4")(createLine("PACKAGE VERIFICATION", true)));
    console.log();
    
    const scanSpinner = ora({
        text: gradient.pastel('Scanning bot files for package dependencies...'),
        spinner: 'bouncingBar'
    }).start();
    
    const detectedPackages = scanAllPackages();
    scanSpinner.succeed(gradient.pastel(`Found ${detectedPackages.length} unique packages used in bot`));
    console.log();
    
    const missingPackages = [];
    const installedPackages = [];
    let checkedCount = 0;
    
    const checkSpinner = ora({
        text: gradient.cristal('Verifying package installations...'),
        spinner: 'dots12'
    }).start();
    
    for (const pkg of detectedPackages) {
        checkedCount++;
        checkSpinner.text = gradient.cristal(`Checking [${checkedCount}/${detectedPackages.length}] ${pkg}`);
        
        try {
            require.resolve(pkg);
            installedPackages.push(pkg);
        } catch (error) {
            missingPackages.push(pkg);
        }
    }
    
    checkSpinner.stop();
    
    if (installedPackages.length > 0) {
        console.log(gradient("#06FFA5", "#09FBD3")(`✓ Verified ${installedPackages.length} packages: ${installedPackages.slice(0, 5).join(', ')}${installedPackages.length > 5 ? '...' : ''}`));
    }
    
    if (missingPackages.length > 0) {
        console.log(gradient("#FF6B6B", "#FFE66D")(`✗ Missing ${missingPackages.length} packages: ${missingPackages.join(', ')}`));
        console.log();
        
        const installSpinner = ora({
            text: gradient.rainbow('Installing missing packages...'),
            spinner: 'aesthetic'
        }).start();
        
        for (let i = 0; i < missingPackages.length; i++) {
            const pkg = missingPackages[i];
            try {
                installSpinner.text = gradient.rainbow(`Installing [${i + 1}/${missingPackages.length}] ${pkg}...`);
                execSync(`npm install ${pkg} --save --silent`, { stdio: 'pipe' });
                installSpinner.text = gradient.rainbow(`✓ Installed ${pkg}`);
            } catch (error) {
                installSpinner.fail(gradient("#FF6B6B", "#C44569")(`Failed to install ${pkg}`));
                log.error("PKG CHECK", `Failed to install ${pkg}: ${error.message}`);
                process.exit(1);
            }
        }
        
        installSpinner.succeed(gradient.rainbow(`All ${missingPackages.length} missing packages installed successfully!`));
    }
    
    console.log();
    console.log(gradient("#06FFA5", "#09FBD3")(`✓ All ${detectedPackages.length} packages verified and ready!`));
    console.log();
    console.log(gradient("#FF6B6B", "#4ECDC4")(createLine(null, true)));
    console.log();
}

async function loadDatabase() {
    const log = require('../logger/log.js');
    const config = require('../loadConfig.js');
    const mongoose = require('mongoose');
    
    console.log(gradient("#A8E6CF", "#FFD3B6")(createLine("DATABASE CONNECTION", true)));
    console.log();
    
    const dbSpinner = ora({
        text: gradient.mind('Connecting to MongoDB...'),
        spinner: 'arc'
    }).start();
    
    try {
        await mongoose.connect(config.database.mongodbUri);
        dbSpinner.succeed(gradient.mind('Connected to MongoDB successfully'));
        
        const controllerSpinner = ora({
            text: gradient.vice('Initializing database controllers...'),
            spinner: 'simpleDots'
        }).start();
        
        await require('../database/controller/index.js')();
        controllerSpinner.succeed(gradient.vice('Database controllers initialized'));
        
        console.log();
        console.log(gradient("#A8E6CF", "#FFD3B6")(createLine(null, true)));
        console.log();
        return true;
    } catch (error) {
        dbSpinner.fail(gradient("#FF6B6B", "#C44569")(`Failed to connect: ${error.message}`));
        throw error;
    }
}

async function loadCommands(client) {
    const log = require('../logger/log.js');
    
    console.log(gradient("#FFEAA7", "#FDCB6E")(createLine("LOADING COMMANDS", true)));
    console.log();
    
    try {
        await require('../handlers/loadCommands.js')(client);
        
        console.log();
        console.log(gradient("#FFEAA7", "#FDCB6E")(createLine(null, true)));
        console.log();
        return true;
    } catch (error) {
        log.error("COMMANDS", `Critical error: ${error.message}`);
        throw error;
    }
}

async function loadEvents(client) {
    const log = require('../logger/log.js');
    
    console.log(gradient("#74B9FF", "#A29BFE")(createLine("LOADING EVENTS", true)));
    console.log();
    
    try {
        await require('../handlers/loadEvents.js')(client);
        
        console.log();
        console.log(gradient("#74B9FF", "#A29BFE")(createLine(null, true)));
        console.log();
        return true;
    } catch (error) {
        log.error("EVENTS", `Critical error: ${error.message}`);
        throw error;
    }
}

async function loginBot(client, config) {
    const log = require('../logger/log.js');
    
    console.log(gradient("#FF7675", "#FD79A8")(createLine("BOT LOGIN", true)));
    console.log();
    
    const loginSpinner = ora({
        text: gradient.retro('Connecting to Discord Gateway...'),
        spinner: 'line'
    }).start();
    
    try {
        await client.login(config.discord.token);
        loginSpinner.succeed(gradient.retro(`Logged in as ${client.user.tag}`));
        console.log();
        console.log(gradient("#FF7675", "#FD79A8")(createLine(null, true)));
        console.log();
        return true;
    } catch (error) {
        loginSpinner.fail(gradient("#FF6B6B", "#C44569")(`Failed to login: ${error.message}`));
        throw error;
    }
}

async function checkRestartNotification(client) {
    const log = require('../logger/log.js');
    const restartFilePath = path.join(process.cwd(), 'scripts', 'commands', 'tmp', 'restart.txt');
    
    if (fs.existsSync(restartFilePath)) {
        try {
            const data = await fs.readFile(restartFilePath, 'utf-8');
            const [channelId, userId, messageId, timestamp] = data.trim().split('|');
            
            if (channelId && userId && messageId && timestamp) {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                
                if (channel) {
                    const restartTime = ((Date.now() - parseInt(timestamp)) / 1000).toFixed(2);
                    const successMessage = `✅ Bot successfully restarted! <@${userId}>\n⏰ Restart completed in **${restartTime}s**`;
                    
                    try {
                        const originalMessage = await channel.messages.fetch(messageId).catch(() => null);
                        if (originalMessage) {
                            await originalMessage.edit(successMessage);
                            log.success("RESTART", `Restart notification edited in channel ${channelId} (${restartTime}s)`);
                        } else {
                            await channel.send(successMessage);
                            log.success("RESTART", `Restart notification sent to channel ${channelId} (${restartTime}s)`);
                        }
                    } catch (editError) {
                        await channel.send(successMessage);
                        log.success("RESTART", `Restart notification sent to channel ${channelId} (${restartTime}s)`);
                    }
                }
            }
            
            await fs.unlink(restartFilePath);
        } catch (error) {
            log.error("RESTART", `Failed to send restart notification: ${error.message}`);
            try {
                await fs.unlink(restartFilePath);
            } catch {}
        }
    }
}

async function initializePresence(client) {
    const log = require('../logger/log.js');
    
    console.log(gradient("#DDA15E", "#BC6C25")(createLine("PRESENCE MANAGER", true)));
    console.log();
    
    const presenceSpinner = ora({
        text: gradient.morning('Initializing presence manager...\n'),
        spinner: 'point'
    }).start();
    
    try {
        const PresenceManager = require('../utils/presenceManager.js');
        global.RentoBot.presenceManager = new PresenceManager(client);
        await global.RentoBot.presenceManager.loadFromConfig();
        presenceSpinner.succeed(gradient.morning('Presence manager initialized'));
        console.log();
        console.log(gradient("#DDA15E", "#BC6C25")(createLine(null, true)));
        console.log();
    } catch (error) {
        presenceSpinner.fail(gradient("#FF6B6B", "#C44569")(`Failed to initialize presence: ${error.message}`));
    }
}

async function startDashboard(client, config) {
    const log = require('../logger/log.js');
    
    if (config.dashboard.enabled) {
        console.log(gradient("#E056FD", "#F7797D")(createLine("DASHBOARD", true)));
        console.log();
        
        const dashboardSpinner = ora({
            text: gradient.passion('Starting web dashboard...'),
            spinner: 'clock'
        }).start();
        
        try {
            require('../dashboard/app.js')(client);
            dashboardSpinner.succeed(gradient.passion(`Dashboard started on port ${config.dashboard.port}`));
            console.log();
            console.log(gradient("#E056FD", "#F7797D")(createLine(null, true)));
            console.log();
        } catch (error) {
            dashboardSpinner.fail(gradient("#FF6B6B", "#C44569")(`Failed to start dashboard: ${error.message}`));
        }
    }
}

async function checkForUpdatesOnStartup() {
    const log = require('../logger/log.js');
    const axios = require('axios');
    const { colors } = require('../func/colors.js');
    
    try {
        console.log(gradient("#A8E6CF", "#FFD3B6")(createLine("VERSION CHECK", true)));
        console.log();
        
        const checkSpinner = ora({
            text: gradient.mind('Checking for updates...'),
            spinner: 'dots12'
        }).start();
        
        // Get current version
        const packageJson = require('../package.json');
        const currentVersion = packageJson.version;
        
        // Get latest version from GitHub
        const { data: latestPackageJson } = await axios.get('https://raw.githubusercontent.com/notsopreety/Rento-Bot/main/package.json', {
            timeout: 10000
        });
        const latestVersion = latestPackageJson.version;
        
        // Compare versions
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
        
        const comparison = compareVersion(latestVersion, currentVersion);
        
        checkSpinner.stop();
        
        if (comparison > 0) {
            // Update available
            console.log(gradient("#FFE66D", "#FF6B6B")(`⚠️  Update Available!`));
            console.log(`${colors.yellow}   Current Version: ${currentVersion}${colors.reset}`);
            console.log(`${colors.green}   Latest Version:  ${latestVersion}${colors.reset}`);
            console.log(`${colors.cyan}   Use !update command to update the bot${colors.reset}`);
            console.log();
            log.warn("UPDATE", `Update available! Current: ${currentVersion}, Latest: ${latestVersion}`);
        } else if (comparison < 0) {
            // Current version is newer (shouldn't happen, but handle it)
            console.log(gradient("#06FFA5", "#09FBD3")(`✓ You are on a development version`));
            console.log(`${colors.yellow}  Version: ${currentVersion}${colors.reset}`);
            console.log(`${colors.green}  Latest stable: ${latestVersion}${colors.reset}`);
            console.log();
            log.info("UPDATE", `Development version detected: ${currentVersion}`);
        } else {
            // Up to date
            console.log(gradient("#06FFA5", "#09FBD3")(`✓ You are on the latest version`));
            console.log(`${colors.green}  Version: ${currentVersion}${colors.reset}`);
            console.log();
            log.success("UPDATE", `Bot is up to date: ${currentVersion}`);
        }
        
        console.log(gradient("#A8E6CF", "#FFD3B6")(createLine(null, true)));
        console.log();
        
    } catch (error) {
        // Don't fail startup if update check fails
        console.log(gradient("#FFE66D", "#FF6B6B")(`⚠️  Could not check for updates: ${error.message}`));
        console.log();
        log.warn("UPDATE", `Failed to check for updates: ${error.message}`);
    }
}

async function login(client, config) {
    try {
        displayBanner();
        
        await checkForUpdatesOnStartup();
        await checkPackages();
        await loadDatabase();
        await loadCommands(client);
        await loadEvents(client);
        await loginBot(client, config);
        await initializePresence(client);
        await checkRestartNotification(client);
        await startDashboard(client, config);
        
        const log = require('../logger/log.js');
        
        console.log(gradient("#00B4DB", "#0083B0")(createLine(null, true)));
        console.log();
        
        const readyText = "🚀 BOT IS NOW ONLINE AND READY TO SERVE! 🚀";
        const readyGradient = gradient.rainbow(readyText);
        centerText(readyGradient, readyText.length);
        
        console.log();
        console.log(gradient("#00B4DB", "#0083B0")(createLine(null, true)));
        console.log();
        
    } catch (error) {
        const log = require('../logger/log.js');
        log.error("STARTUP", `Critical error during startup: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

module.exports = login;
