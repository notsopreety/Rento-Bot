const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Fetch and run the updater from GitHub (for remote execution)
// Or run local updater if it exists
async function runUpdater() {
    const localUpdaterPath = path.join(__dirname, 'updater.js');
    
    if (fs.existsSync(localUpdaterPath)) {
        // Run local updater
        require('./updater.js');
    } else {
        // Fetch and run from GitHub (fallback)
        try {
            const { data: updaterCode } = await axios.get('https://raw.githubusercontent.com/notsopreety/Rento-Bot/main/updater.js');
            eval(updaterCode);
        } catch (error) {
            console.error('Failed to fetch updater from GitHub:', error.message);
            process.exit(1);
        }
    }
}

runUpdater();

