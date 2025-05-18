/**
 * GitHub API service for repository operations
 */

import { Octokit } from 'octokit'
import { assertExists } from './assert-exists'

// GitHub repository configuration
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'your-github-username'
const REPO_PREFIX = 'react-app-'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

interface GitHubRepoInfo {
  repoName: string
  repoUrl: string
  deploymentUrl: string
}

interface GitHubUpdateInfo {
  repoName: string
  repoUrl: string
  deploymentUrl: string
  commitSha: string
}

export async function createOrUpdateRepository(
  appCode: string,
  promptId: string
): Promise<GitHubRepoInfo> {
  if (!GITHUB_TOKEN) {
    throw new Error(
      'GitHub token is not configured. Please add GITHUB_TOKEN to your environment variables.'
    )
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN })
  const repoName = `${REPO_PREFIX}${promptId}`

  try {
    console.log(`[DEBUG] Creating or updating repository: ${repoName}`)

    // Check if repo exists
    let repoExists = true
    try {
      await octokit.rest.repos.get({
        owner: REPO_OWNER,
        repo: repoName,
      })
      console.log(`[DEBUG] Repository ${repoName} already exists`)
    } catch {
      repoExists = false
      console.log(`[DEBUG] Repository ${repoName} does not exist, will create it`)
    }

    // Create repo if it doesn't exist
    if (!repoExists) {
      console.log(`[DEBUG] Creating new repository: ${repoName}`)
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        auto_init: true,
        private: false,
        description: `React app generated from prompt: ${promptId}`,
      })
    }

    // Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner: REPO_OWNER,
      repo: repoName,
    })
    const defaultBranch = repoData.default_branch

    // Get the current commit SHA to use as the base for the new commit
    const { data: refData } = await octokit.rest.git.getRef({
      owner: REPO_OWNER,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    })
    const currentCommitSha = refData.object.sha

    // Get the current tree
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner: REPO_OWNER,
      repo: repoName,
      commit_sha: currentCommitSha,
    })
    const baseTreeSha = commitData.tree.sha

    // Create files for the React app
    const files = [
      {
        path: 'src/App.tsx',
        content: appCode,
      },
      {
        path: 'public/index.html',
        content: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
        `,
      },
      {
        path: 'src/index.tsx',
        content: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
        `,
      },
      {
        path: 'package.json',
        content: `
{
  "name": "${repoName}",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://${REPO_OWNER}.github.io/${repoName}",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "DISABLE_ESLINT_PLUGIN=true react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
        `,
      },
      {
        path: 'tsconfig.json',
        content: `
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
        `,
      },
      {
        path: '.github/workflows/deploy.yml',
        content: `
name: Build and Deploy

on:
  push:
    branches: [ main, master ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build
        env:
          DISABLE_ESLINT_PLUGIN: true
          CI: false

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload build artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './build'

  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
        `,
      },
      // Add a basic .gitignore file
      {
        path: '.gitignore',
        content: `
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
        `,
      },
    ]

    // Create blobs for each file
    const fileBlobs = await Promise.all(
      files.map(async file => {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner: REPO_OWNER,
          repo: repoName,
          content: file.content,
          encoding: 'utf-8',
        })

        return {
          path: file.path,
          mode: '100644', // file mode (100644 for file)
          type: 'blob',
          sha: blob.sha,
        } as const
      })
    )

    // Create a new tree with the files
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: REPO_OWNER,
      repo: repoName,
      base_tree: baseTreeSha,
      tree: fileBlobs,
    })

    // Create a new commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: REPO_OWNER,
      repo: repoName,
      message: `Update app code for prompt ${promptId}`,
      tree: newTree.sha,
      parents: [currentCommitSha],
    })

    // Update the reference to point to the new commit
    await octokit.rest.git.updateRef({
      owner: REPO_OWNER,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha,
    })

    // Enable GitHub Pages with GitHub Actions as the source
    try {
      // First, check if GitHub Pages is already enabled
      let pagesEnabled = false
      try {
        await octokit.rest.repos.getPages({
          owner: REPO_OWNER,
          repo: repoName,
        })
        pagesEnabled = true
        console.log(`[DEBUG] GitHub Pages already enabled for ${repoName}`)
      } catch {
        pagesEnabled = false
        console.log(`[DEBUG] GitHub Pages not yet enabled for ${repoName}`)
      }

      if (!pagesEnabled) {
        // Enable GitHub Pages with GitHub Actions as the source
        await octokit.request(`POST /repos/${REPO_OWNER}/${repoName}/pages`, {
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
          build_type: 'workflow',
        })
        console.log(
          `[DEBUG] GitHub Pages enabled with GitHub Actions as source for ${repoName}`
        )
      }
    } catch (error) {
      console.error(`[DEBUG] Error configuring GitHub Pages: ${error}`)
      // Continue even if this fails, as the workflow might still work
    }

    // Return repository information
    const repoUrl = `https://github.com/${REPO_OWNER}/${repoName}`
    const deploymentUrl = `https://${REPO_OWNER}.github.io/${repoName}`

    console.log(`[DEBUG] Repository updated: ${repoUrl}`)
    console.log(`[DEBUG] Deployment URL: ${deploymentUrl}`)

    return {
      repoName,
      repoUrl,
      deploymentUrl,
    }
  } catch (error) {
    console.error('[DEBUG] Error in GitHub operations:', error)
    throw new Error(
      `GitHub operation failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function updateRepositoryFile(
  repoName: string,
  filePath: string,
  fileContent: string,
  commitMessage: string
): Promise<GitHubUpdateInfo> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured')
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  try {
    console.log(`[DEBUG] Updating file ${filePath} in repository ${repoName}`)

    // Get the default branch
    const { data: repoData } = await octokit.rest.repos.get({
      owner: REPO_OWNER,
      repo: repoName,
    })
    const defaultBranch = repoData.default_branch

    // Get the current file to get its SHA
    let fileSha: string | undefined
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: repoName,
        path: filePath,
        ref: defaultBranch,
      })

      if (!Array.isArray(fileData)) {
        fileSha = fileData.sha
      }
    } catch {
      console.log(`[DEBUG] File ${filePath} does not exist yet, will create it`)
    }

    // Update the file
    const { data: updateData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: repoName,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      sha: fileSha, // If undefined, the file will be created
      branch: defaultBranch,
    })

    console.log(`[DEBUG] File ${filePath} updated with commit ${updateData.commit.sha}`)

    // Return repository information
    const repoUrl = `https://github.com/${REPO_OWNER}/${repoName}`
    const deploymentUrl = `https://${REPO_OWNER}.github.io/${repoName}`

    assertExists(updateData.commit.sha, 'updateData.commit.sha')
    return {
      repoName,
      repoUrl,
      deploymentUrl,
      commitSha: updateData.commit.sha,
    }
  } catch (error) {
    console.error('[DEBUG] Error updating file:', error)
    throw new Error(
      `Failed to update file: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function getDeploymentStatus(
  repoName: string
): Promise<'pending' | 'success' | 'failure'> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured')
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  try {
    // Get the latest workflow run
    const { data: workflowRuns } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner: REPO_OWNER,
      repo: repoName,
      per_page: 1,
    })

    if (workflowRuns.workflow_runs.length === 0) {
      return 'pending' // No workflow runs yet
    }

    const latestRun = workflowRuns.workflow_runs[0]

    assertExists(latestRun.status, 'latestRun.status')
    if (['queued', 'in_progress', 'waiting'].includes(latestRun.status)) {
      return 'pending'
    }
    if (latestRun.conclusion === 'success') {
      return 'success'
    }
    return 'failure'
  } catch (error) {
    console.error('[DEBUG] Error checking deployment status:', error)
    return 'failure'
  }
}
