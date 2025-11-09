# 🔄 Bot Updater System

This bot includes an automatic updater system similar to Goat-Bot-V2 that allows you to update the bot directly from GitHub.

## 📋 Features

- ✅ **Version Checking**: Automatically checks if a newer version is available
- ✅ **Automatic Backups**: Creates backups of previous version before updating
- ✅ **File Updates**: Updates specific files based on `versions.json`
- ✅ **Config Merging**: Smart merging of `config.json` changes
- ✅ **Dependency Management**: Optionally reinstalls dependencies when needed
- ✅ **Cooldown Protection**: Prevents updates if last commit was less than 5 minutes ago
- ✅ **Multiple Update Methods**: Update via Discord command or script

## 🚀 Usage

### Method 1: Discord Command (Recommended)

1. Use the `!update` command (requires bot admin role)
2. The bot will check for updates and show you what will be updated
3. React with ✅ or click the "Confirm Update" button to proceed
4. After update, you can restart the bot by clicking "Restart Bot"

### Method 2: Script Execution

Run the updater script directly:

```bash
node update.js
```

Or:

```bash
node updater.js
```

## 📝 versions.json Structure

The `versions.json` file tracks what files need to be updated for each version:

```json
[
    {
        "version": "1.0.3",
        "files": {
            "Bot.js": "Fixed error handling",
            "handlers/loadCommands.js": "Improved command loading",
            "config.json": {
                "bot.prefix": "!",
                "dashboard.port": 5000
            }
        },
        "deleteFiles": {
            "oldFile.js": "Removed deprecated file"
        },
        "reinstallDependencies": false
    }
]
```

### Fields Explanation

- **version**: The version number (e.g., "1.0.3")
- **files**: Object mapping file paths to update descriptions
  - For regular files: `"path/to/file.js": "Description of changes"`
  - For config.json: `"config.json": { "key": "value" }` (will be merged)
- **deleteFiles**: Object mapping file paths to deletion descriptions
- **reinstallDependencies**: Boolean indicating if `npm install` should run

### Special File Handling

#### config.json

When updating `config.json`, the updater will:
- Merge new values with existing config
- Preserve your custom settings
- Use `DEFAULT_` prefix to copy values from other keys

Example:
```json
{
    "config.json": {
        "bot.prefix": "DEFAULT_bot.prefix",
        "dashboard.port": 5000
    }
}
```

#### Skip Update Marker

Add this comment at the top of any file to prevent it from being updated:

```javascript
// DO NOT UPDATE THIS FILE
// or
// SKIP UPDATE
// or
// DO NOT UPDATE
```

## 💾 Backup System

Before updating, the bot automatically creates a backup in the `backups/` directory:

```
backups/
  └── backup_1.0.2_1234567890/
      ├── Bot.js
      ├── package.json
      ├── config.json
      └── ...
```

Backup naming format: `backup_{version}_{timestamp}`

### What Gets Backed Up

- All files that will be updated
- All files that will be deleted
- Important directories (handlers, scripts, database, etc.)

### What Gets Excluded

- `node_modules/`
- `backups/`
- `.git/`
- `.env`
- `package-lock.json`
- `scripts/commands/tmp/`
- `Goat-Bot-V2/`

## 🔒 Security Features

1. **Cooldown Protection**: Prevents updates if last commit was < 5 minutes ago
2. **Admin Only**: Update command requires bot admin role (role: 2)
3. **Backup Before Update**: Always creates backup before making changes
4. **Error Handling**: Gracefully handles network errors and file issues

## 📊 Update Process

1. Check for updates on GitHub
2. Compare current version with latest version
3. Check commit cooldown (5 minutes)
4. Create backup of current version
5. Download and update files
6. Merge config.json changes
7. Delete specified files
8. Update package.json and versions.json
9. Reinstall dependencies if needed
10. Prompt for restart

## 🛠️ Troubleshooting

### Update Fails

1. Check your internet connection
2. Verify GitHub repository is accessible
3. Check if last commit was too recent (< 5 minutes)
4. Review error logs in console

### Restore from Backup

If something goes wrong, you can restore from backup:

```bash
# Find your backup
ls backups/

# Copy files back
cp -r backups/backup_1.0.2_1234567890/* ./
```

### Manual Update

If automatic update fails, you can manually:

1. Pull latest changes from GitHub
2. Run `npm install` if needed
3. Restart the bot

## 📝 Adding New Versions

When releasing a new version:

1. Update `package.json` version
2. Add entry to `versions.json`:
   ```json
   {
       "version": "1.0.4",
       "files": {
           "path/to/file.js": "Description"
       },
       "deleteFiles": {},
       "reinstallDependencies": false
   }
   ```
3. Commit and push to GitHub
4. Wait at least 5 minutes before users can update

## 🔗 Related Files

- `updater.js` - Main updater logic
- `update.js` - Script runner
- `scripts/commands/update.js` - Discord command
- `versions.json` - Version tracking
- `backups/` - Backup directory

## 📚 References

- Inspired by [Goat-Bot-V2](https://github.com/ntkhang03/Goat-Bot-V2)
- Repository: [Rento-Bot](https://github.com/notsopreety/Rento-Bot)

