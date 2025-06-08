const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/sujeethshingade/siteomatic-website-template.git`; // Replace with your Repo B URL
const cloneDir = './temp-centralized-website';
const updatedJson = require('./generated.json'); // This is your generated JSON

(async () => {
  try {
    // Remove previous clone if exists
    await fs.remove(cloneDir);

    // Clone Repo B
    const git = simpleGit();
    await git.clone(repoUrl, cloneDir);

    // Path to the centralized JSON file in website repo
    const jsonPath = path.join(cloneDir, 'data', 'central.json'); // Adjust path if needed
    await fs.writeJson(jsonPath, updatedJson, { spaces: 2 });

    // Commit and push
    const websiteGit = simpleGit(cloneDir);
    await websiteGit.add('./*');
    await websiteGit.commit(`Update siteConfig.ts from JSON Generator`);
    await websiteGit.push('origin', 'main'); // or 'master' if that’s your default

    console.log('✅ siteConfig.ts updated and pushed!');
  } catch (error) {
    console.error('❌ Failed to update and push:', error);
  }
})();
