# 🤖 Speakio MCP Integrations

This folder contains the template configuration to integrate **Model Context Protocol (MCP)** servers into your AI assistants (like Claude Desktop) to supercharge your development workflow on the Speakio project.

## Included MCP Servers

1. **Playwright (`@automatalabs/mcp-server-playwright`)**: Allows the AI to navigate the web, extract metadata (OpenGraph tags), and scrape text dynamically.
2. **MongoDB (`mongodb-mcp-server`)**: Grants the AI the ability to query, list, and modify your local Speakio MongoDB database directly (`users`, `resources`, `roadmaps`, etc.).
3. **GitHub (`ghcr.io/github/github-mcp-server`)**: Gives the AI access to read branches, pull requests, issues, and private files directly from your remote GitHub repository.

---

## 🚀 How to Setup

### 1. Locate your Claude Desktop configuration file

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 2. Copy the template

Copy the contents of the `claude_desktop_config.json.template` file into your configuration file.

### 3. Configure the Environment Variables

Before saving, make sure to replace the placeholder values in your configuration:

- **MongoDB**: Change the port if your Docker instance is running on a different port than `27018` (e.g., `MDB_MCP_CONNECTION_STRING: mongodb://localhost:27018/speakio`).
- **GitHub**: Generate a classic **Personal Access Token (PAT)** on GitHub with the `repo` scope (necessary to read private repositories). Replace `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE` with your actual token.

### 4. Restart Claude Desktop

Once the JSON file is saved, completely close and restart your Claude Desktop application for the MCP servers to spin up. You will see the new MCP tools appear in the interface!
