#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration - Can be overridden by environment variables
const REPO = process.env.GITHUB_REPO || 'ornate-source/blackIDE';
const OUTPUT_FILE = path.join(__dirname, 'releases.js');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchLatestRelease() {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  const headers = {
    'User-Agent': 'node-release-updater',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    console.log('Using GitHub token for authentication...');
  }

  console.log(`Fetching latest release details for ${REPO} from GitHub API...`);
  
  const response = await fetch(url, { headers });
  
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');

  if (!response.ok) {
    const errorText = await response.text();
    let rateLimitInfo = '';
    if (limit !== null && remaining !== null && reset !== null) {
      const resetTime = new Date(parseInt(reset, 10) * 1000).toLocaleString();
      rateLimitInfo = `\nRate Limit Info: Limit: ${limit}, Remaining: ${remaining}, Reset Time: ${resetTime}`;
    }
    throw new Error(`Failed to fetch release: ${response.status} ${response.statusText}${rateLimitInfo}\n${errorText}`);
  }
  
  return await response.json();
}

function formatReleaseData(releaseData) {
  const simplifiedRelease = {
    tag_name: releaseData.tag_name,
    assets: releaseData.assets.map(asset => ({
      name: asset.name,
      browser_download_url: asset.browser_download_url,
      size: asset.size
    }))
  };

  return `// Static release assets data source to prevent GitHub API rate limit issues
window.LATEST_RELEASE = ${JSON.stringify(simplifiedRelease, null, 2)};
`;
}

async function main() {
  try {
    const releaseData = await fetchLatestRelease();
    
    if (!releaseData || !releaseData.tag_name || !releaseData.assets) {
      throw new Error('Invalid release data structure received from GitHub API.');
    }

    console.log(`Latest release found: ${releaseData.tag_name} (${releaseData.assets.length} assets)`);
    
    const formattedData = formatReleaseData(releaseData);
    
    fs.writeFileSync(OUTPUT_FILE, formattedData, 'utf8');
    console.log(`Successfully updated release data in: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error updating release data:', error.message);
    if (error.cause) {
      console.error('Details:', error.cause.message || error.cause);
    }
    process.exit(1);
  }
}

main();
