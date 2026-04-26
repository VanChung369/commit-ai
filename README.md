# commit-ai

Generate Git commit messages with AI, then commit from your terminal.

`commit-ai` reads your Git diff, asks Ollama or Gemini to write a Conventional Commit message, lets you edit the message, and runs `git commit`.

## What It Does

- Generates commit messages from your Git changes
- Supports `ollama` and `gemini`
- Runs a first-time setup when you use it for the first time
- Lets you edit the generated commit message before committing
- Auto-stages files when nothing is staged
- Can push after commit with `--push`
- Stores user config outside your repository
- Automatically excludes lockfiles from the diff sent to AI to save tokens and improve message quality

## Requirements

- Node.js 20 or newer
- Git
- One AI provider:
  - Ollama local or remote server
  - Gemini API key

## Install

### From npm

```bash
npm install -g commit-ai
```

Then run:

```bash
commit-ai
```

### From Yarn

```bash
yarn global add commit-ai
```

Then run:

```bash
commit-ai
```

### From This Repository

```bash
git clone https://github.com/VanChung369/commit-ai.git
cd commit-ai
yarn install
yarn build
yarn link
```

Now the `commit-ai` command is available globally on your machine.

## First-Time Setup

The first time you run:

```bash
commit-ai
```

the tool asks for only the required setup:

- AI provider: `ollama` or `gemini`
- Commit message language: English or Vietnamese
- Provider-specific values:
  - Ollama: base URL and model
  - Gemini: API key and model

You can also run setup manually:

```bash
commit-ai config setup
```

## Basic Usage

Go to any Git repository:

```bash
cd path/to/your/repo
```

Run:

```bash
commit-ai
```

The tool will:

1. Read staged changes
2. Auto-stage files if nothing is staged
3. Generate a commit message
4. Let you edit the message
5. Ask for confirmation
6. Run `git commit`

Commit and push:

```bash
commit-ai --push
```

Skip editing:

```bash
commit-ai --no-edit
```

Skip confirmation:

```bash
commit-ai --yes
```

Skip both editing and confirmation:

```bash
commit-ai --no-edit --yes
```

Do not auto-stage files:

```bash
commit-ai --no-stage
```

## Ollama Setup

Local Ollama:

```bash
commit-ai config set provider ollama
commit-ai config set ollamaUrl http://localhost:11434
commit-ai config set model qwen2.5:1.5b
```

Remote Ollama:

```bash
commit-ai config set provider ollama
commit-ai config set ollamaUrl https://ai.example.com
commit-ai config set model qwen2.5:1.5b
```

Use without saving config:

```bash
commit-ai --provider ollama --ollama-url http://localhost:11434 --model qwen2.5:1.5b
```

## Gemini Setup

Save Gemini config:

```bash
commit-ai config set provider gemini
commit-ai config set model gemini-2.5-flash
commit-ai config set geminiApiKey YOUR_API_KEY
```

Use an environment variable instead:

```bash
set GEMINI_API_KEY=YOUR_API_KEY
commit-ai --provider gemini
```

On macOS or Linux:

```bash
export GEMINI_API_KEY=YOUR_API_KEY
commit-ai --provider gemini
```

Use without saving config:

```bash
commit-ai --provider gemini --gemini-api-key YOUR_API_KEY --model gemini-1.5-flash
```

## Config Commands

Run setup again:

```bash
commit-ai config setup
```

Show all config:

```bash
commit-ai config list
```

Get one value:

```bash
commit-ai config get provider
```

Set one value:

```bash
commit-ai config set language vi
```

Reset config:

```bash
commit-ai config reset
```

Show config file path:

```bash
commit-ai config path
```

Config is stored in a user-level JSON file using `conf`. It is not committed to your project.

## Useful Options

```bash
commit-ai --provider ollama
commit-ai --provider gemini
commit-ai --language en
commit-ai --language vi
commit-ai --max-length 72
commit-ai --max-diff-chars 10000
commit-ai --temperature 0.2
```

Ollama-specific:

```bash
commit-ai --num-predict 40
```

Gemini-specific:

```bash
commit-ai --max-output-tokens 1280
```

## Troubleshooting

### `Current directory is not a Git repository`

Run the command inside a Git repository:

```bash
cd path/to/your/repo
commit-ai
```

### Ollama Request Timeout

If your Ollama server is slow or behind a proxy, reduce the diff size:

```bash
commit-ai --max-diff-chars 2000 --num-predict 30
```

### Gemini API Key Missing

Set the key:

```bash
commit-ai config set geminiApiKey YOUR_API_KEY
```

or:

```bash
set GEMINI_API_KEY=YOUR_API_KEY
```

## Development

```bash
yarn install
yarn dev -- --help
yarn dev -- config setup
yarn build
```

Run the built CLI:

```bash
node dist/cli.js --help
```

Link locally:

```bash
yarn build
yarn link
commit-ai --help
```

Unlink:

```bash
yarn unlink
```

## Security Notes

`commit-ai` sends your staged diff to the configured AI provider. Do not use a remote provider for changes that contain secrets, credentials, private keys, or sensitive code.
