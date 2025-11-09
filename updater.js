const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const log = require('./logger/log.js');
const { colors } = require('./func/colors.js');

const REPO_OWNER = 'notsopreety';
const REPO_NAME = 'Rento-Bot';
const REPO_BRANCH = 'main';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

/**
 * Compare two version strings (e.g., "1.0.2" vs "1.0.3")
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
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

/**
 * Create backup of current version
 */
async function createBackup(currentVersion) {
    const backupsPath = path.join(process.cwd(), 'backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupsPath)) {
        fs.mkdirSync(backupsPath, { recursive: true });
    }
    
    const backupFolder = path.join(backupsPath, `backup_${currentVersion}_${Date.now()}`);
    fs.mkdirSync(backupFolder, { recursive: true });
    
    log.info('BACKUP', `Creating backup in ${backupFolder}...`);
    
    // Files and directories to backup (exclude node_modules, backups, .git, etc.)
    const excludePatterns = [
        'node_modules',
        'backups',
        '.git',
        '.gitignore',
        'package-lock.json',
        '.env',
        'restart.txt',
        'scripts/commands/tmp',
        'Goat-Bot-V2'
    ];
    
    function shouldExclude(filePath) {
        const relativePath = path.relative(process.cwd(), filePath);
        return excludePatterns.some(pattern => relativePath.includes(pattern));
    }
    
    // Copy files to backup
    async function copyToBackup(src, dest) {
        try {
            const stat = fs.statSync(src);
            
            if (stat.isDirectory()) {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                
                const items = fs.readdirSync(src);
                for (const item of items) {
                    const srcPath = path.join(src, item);
                    const destPath = path.join(dest, item);
                    
                    if (!shouldExclude(srcPath)) {
                        await copyToBackup(srcPath, destPath);
                    }
                }
            } else {
                const destDir = path.dirname(dest);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                fs.copyFileSync(src, dest);
            }
        } catch (error) {
            log.warn('BACKUP', `Failed to backup ${src}: ${error.message}`);
        }
    }
    
    // Backup important files and directories
    const importantPaths = [
        'Bot.js',
        'index.js',
        'loadConfig.js',
        'utils.js',
        'package.json',
        'config.json',
        'versions.json',
        'handlers',
        'scripts',
        'database',
        'dashboard',
        'utils',
        'logger',
        'login'
    ];
    
    for (const item of importantPaths) {
        const srcPath = path.join(process.cwd(), item);
        if (fs.existsSync(srcPath) && !shouldExclude(srcPath)) {
            const destPath = path.join(backupFolder, item);
            await copyToBackup(srcPath, destPath);
        }
    }
    
    log.success('BACKUP', `Backup created successfully: ${backupFolder}`);
    return backupFolder;
}

/**
 * Check if update is available
 */
async function checkForUpdates() {
    try {
        // Get current version
        const packageJson = require('./package.json');
        const currentVersion = packageJson.version;
        
        // Get latest version from GitHub
        const { data: latestPackageJson } = await axios.get(`${GITHUB_RAW_BASE}/package.json`);
        const latestVersion = latestPackageJson.version;
        
        // Compare versions
        const comparison = compareVersion(latestVersion, currentVersion);
        
        if (comparison <= 0) {
            log.info('UPDATE', `You are already on the latest version (${colors.green}${currentVersion}${colors.reset})`);
            return { available: false, currentVersion, latestVersion };
        }
        
        // Get versions.json from GitHub
        const { data: versions } = await axios.get(`${GITHUB_RAW_BASE}/versions.json`);
        
        // Find versions to update
        const currentVersionIndex = versions.findIndex(v => v.version === currentVersion);
        const versionsToUpdate = currentVersionIndex === -1 
            ? versions 
            : versions.slice(currentVersionIndex + 1);
        
        return {
            available: true,
            currentVersion,
            latestVersion,
            versionsToUpdate,
            versions
        };
    } catch (error) {
        log.error('UPDATE', `Failed to check for updates: ${error.message}`);
        throw error;
    }
}

/**
 * Check if last commit was too recent (within 5 minutes)
 */
async function checkCommitCooldown() {
    try {
        const { data: commits } = await axios.get(`${GITHUB_API_BASE}/commits/${REPO_BRANCH}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (commits && commits.length > 0) {
            const lastCommit = commits[0];
            const lastCommitDate = new Date(lastCommit.commit.committer.date);
            const timeDiff = Date.now() - lastCommitDate.getTime();
            const cooldownTime = 5 * 60 * 1000; // 5 minutes
            
            if (timeDiff < cooldownTime) {
                const minutesLeft = Math.floor((cooldownTime - timeDiff) / 1000 / 60);
                const secondsLeft = Math.floor(((cooldownTime - timeDiff) / 1000) % 60);
                return {
                    tooFast: true,
                    minutesLeft,
                    secondsLeft
                };
            }
        }
        
        return { tooFast: false };
    } catch (error) {
        log.warn('UPDATE', `Could not check commit cooldown: ${error.message}`);
        return { tooFast: false };
    }
}

/**
 * Update files based on versions.json
 */
async function updateFiles(versionsToUpdate, currentVersion) {
    // Create backup first
    const backupFolder = await createBackup(currentVersion);
    
    // Merge all updates
    const mergedUpdate = {
        version: '',
        files: {},
        deleteFiles: {},
        reinstallDependencies: false
    };
    
    for (const version of versionsToUpdate) {
        // Merge files to update
        if (version.files) {
            for (const filePath in version.files) {
                // Special handling for config.json - merge instead of replace
                if (filePath === 'config.json') {
                    if (!mergedUpdate.files[filePath]) {
                        mergedUpdate.files[filePath] = {};
                    }
                    mergedUpdate.files[filePath] = {
                        ...mergedUpdate.files[filePath],
                        ...version.files[filePath]
                    };
                } else {
                    mergedUpdate.files[filePath] = version.files[filePath];
                }
            }
        }
        
        // Merge files to delete
        if (version.deleteFiles) {
            for (const filePath in version.deleteFiles) {
                mergedUpdate.deleteFiles[filePath] = version.deleteFiles[filePath];
            }
        }
        
        // Check if dependencies need reinstalling
        if (version.reinstallDependencies) {
            mergedUpdate.reinstallDependencies = true;
        }
        
        mergedUpdate.version = version.version;
    }
    
    log.info('UPDATE', `Updating to version ${colors.yellow}${mergedUpdate.version}${colors.reset}`);
    
    // Update files
    for (const filePath in mergedUpdate.files) {
        const description = mergedUpdate.files[filePath];
        const fullPath = path.join(process.cwd(), filePath);
        
        try {
            // Special handling for config.json
            if (filePath === 'config.json') {
                const currentConfig = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
                const configUpdate = mergedUpdate.files[filePath];
                
                // Merge config updates
                for (const key in configUpdate) {
                    const value = configUpdate[key];
                    if (typeof value === 'string' && value.startsWith('DEFAULT_')) {
                        // Use default value from current config
                        const defaultKey = value.replace('DEFAULT_', '');
                        const _ = require('lodash');
                        _.set(currentConfig, key, _.get(currentConfig, defaultKey, value));
                    } else {
                        const _ = require('lodash');
                        _.set(currentConfig, key, value);
                    }
                }
                
                // Backup current config
                const configBackupPath = path.join(backupFolder, filePath);
                const configBackupDir = path.dirname(configBackupPath);
                if (!fs.existsSync(configBackupDir)) {
                    fs.mkdirSync(configBackupDir, { recursive: true });
                }
                fs.copyFileSync(fullPath, configBackupPath);
                
                // Write updated config
                fs.writeFileSync(fullPath, JSON.stringify(currentConfig, null, 2));
                console.log(`${colors.blue}[↑]${colors.reset} ${filePath}`);
                console.log(`${colors.yellow}[!]${colors.reset} Config file ${colors.yellow}${filePath}${colors.reset} has been updated`);
            } else {
                // Download file from GitHub
                const fileUrl = `${GITHUB_RAW_BASE}/${filePath}`;
                const response = await axios.get(fileUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                // Check if file should be skipped
                const fileExists = fs.existsSync(fullPath);
                if (fileExists) {
                    const firstLine = fs.readFileSync(fullPath, 'utf-8').trim().split(/\r?\n|\r/)[0] || '';
                    const skipMarkers = ['DO NOT UPDATE', 'SKIP UPDATE', 'DO NOT UPDATE THIS FILE'];
                    if (skipMarkers.some(marker => firstLine.includes(marker))) {
                        console.log(`${colors.yellow}[!]${colors.reset} Skipping ${colors.yellow}${filePath}${colors.reset} (marked as DO NOT UPDATE)`);
                        continue;
                    }
                    
                    // Backup existing file
                    const fileBackupPath = path.join(backupFolder, filePath);
                    const fileBackupDir = path.dirname(fileBackupPath);
                    if (!fs.existsSync(fileBackupDir)) {
                        fs.mkdirSync(fileBackupDir, { recursive: true });
                    }
                    fs.copyFileSync(fullPath, fileBackupPath);
                }
                
                // Ensure directory exists
                const fileDir = path.dirname(fullPath);
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }
                
                // Write new file
                fs.writeFileSync(fullPath, Buffer.from(response.data));
                
                const desc = typeof description === 'string' 
                    ? description 
                    : typeof description === 'object' 
                        ? JSON.stringify(description, null, 2) 
                        : description;
                
                const icon = fileExists ? `${colors.blue}[↑]${colors.reset}` : `${colors.green}[+]${colors.reset}`;
                console.log(`${icon} ${filePath}: ${desc}`);
            }
        } catch (error) {
            log.error('UPDATE', `Failed to update ${filePath}: ${error.message}`);
        }
    }
    
    // Delete files
    for (const filePath in mergedUpdate.deleteFiles) {
        const description = mergedUpdate.deleteFiles[filePath];
        const fullPath = path.join(process.cwd(), filePath);
        
        if (fs.existsSync(fullPath)) {
            try {
                const stat = fs.statSync(fullPath);
                
                // Backup before deleting
                const deleteBackupPath = path.join(backupFolder, filePath);
                const deleteBackupDir = path.dirname(deleteBackupPath);
                if (!fs.existsSync(deleteBackupDir)) {
                    fs.mkdirSync(deleteBackupDir, { recursive: true });
                }
                
                if (stat.isDirectory()) {
                    fs.copySync(fullPath, deleteBackupPath);
                    fs.removeSync(fullPath);
                } else {
                    fs.copyFileSync(fullPath, deleteBackupPath);
                    fs.unlinkSync(fullPath);
                }
                
                console.log(`${colors.red}[-]${colors.reset} ${filePath}: ${description}`);
            } catch (error) {
                log.error('UPDATE', `Failed to delete ${filePath}: ${error.message}`);
            }
        }
    }
    
    // Update package.json
    try {
        const { data: latestPackageJson } = await axios.get(`${GITHUB_RAW_BASE}/package.json`);
        const packageBackupPath = path.join(backupFolder, 'package.json');
        fs.copyFileSync(path.join(process.cwd(), 'package.json'), packageBackupPath);
        fs.writeFileSync(path.join(process.cwd(), 'package.json'), JSON.stringify(latestPackageJson, null, 2));
        log.info('UPDATE', 'package.json updated');
    } catch (error) {
        log.error('UPDATE', `Failed to update package.json: ${error.message}`);
    }
    
    // Update versions.json
    try {
        const { data: versions } = await axios.get(`${GITHUB_RAW_BASE}/versions.json`);
        fs.writeFileSync(path.join(process.cwd(), 'versions.json'), JSON.stringify(versions, null, 2));
        log.info('UPDATE', 'versions.json updated');
    } catch (error) {
        log.error('UPDATE', `Failed to update versions.json: ${error.message}`);
    }
    
    // Reinstall dependencies if needed
    if (mergedUpdate.reinstallDependencies) {
        log.info('UPDATE', 'Reinstalling dependencies...');
        try {
            execSync('npm install', { stdio: 'inherit', cwd: process.cwd() });
            log.success('UPDATE', 'Dependencies reinstalled successfully');
        } catch (error) {
            log.error('UPDATE', `Failed to reinstall dependencies: ${error.message}`);
        }
    }
    
    log.success('UPDATE', `Update completed! Backup saved to: ${colors.yellow}${backupFolder}${colors.reset}`);
    return { success: true, backupFolder, newVersion: mergedUpdate.version };
}

/**
 * Main update function
 */
async function runUpdate() {
    try {
        log.info('UPDATE', 'Checking for updates...');
        
        // Check commit cooldown
        const cooldownCheck = await checkCommitCooldown();
        if (cooldownCheck.tooFast) {
            log.error('UPDATE', `Update too fast! Last commit was less than 5 minutes ago. Please wait ${cooldownCheck.minutesLeft}m ${cooldownCheck.secondsLeft}s`);
            return { success: false, reason: 'cooldown' };
        }
        
        // Check for updates
        const updateInfo = await checkForUpdates();
        
        if (!updateInfo.available) {
            return { success: false, reason: 'no_update', currentVersion: updateInfo.currentVersion };
        }
        
        log.info('UPDATE', `Update available! Current: ${colors.yellow}${updateInfo.currentVersion}${colors.reset}, Latest: ${colors.green}${updateInfo.latestVersion}${colors.reset}`);
        log.info('UPDATE', `Updating ${updateInfo.versionsToUpdate.length} version(s)...`);
        
        // Perform update
        const result = await updateFiles(updateInfo.versionsToUpdate, updateInfo.currentVersion);
        
        return {
            success: true,
            currentVersion: updateInfo.currentVersion,
            newVersion: result.newVersion,
            backupFolder: result.backupFolder
        };
    } catch (error) {
        log.error('UPDATE', `Update failed: ${error.message}`);
        console.error(error);
        return { success: false, reason: 'error', error: error.message };
    }
}

// If run directly, execute update
if (require.main === module) {
    runUpdate().then(result => {
        if (result.success) {
            log.success('UPDATE', `Update completed successfully! New version: ${colors.green}${result.newVersion}${colors.reset}`);
            process.exit(0);
        } else {
            if (result.reason === 'no_update') {
                process.exit(0);
            } else {
                process.exit(1);
            }
        }
    }).catch(error => {
        log.error('UPDATE', `Fatal error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runUpdate, checkForUpdates, compareVersion };

