# gitcai - AI Git Commit Message Generator CLI

[![npm version](https://img.shields.io/npm/v/gitcai)](https://www.npmjs.com/package/gitcai)

Generate Conventional Commit messages from your Git diff using Ollama or Gemini, then commit from your terminal.

`gitcai` is an AI Git commit message generator CLI. It reads your staged Git diff, asks Ollama or Gemini to write a clear Conventional Commit message, lets you edit the result, and runs `git commit`.

## Quick Start

```bash
npm install -g gitcai
gitcai
```

## What It Does

- Generates commit messages from your Git changes
- Creates Conventional Commit messages from staged diffs
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
npm install -g gitcai
```

Then run:

```bash
gitcai
```

### From Yarn

```bash
yarn global add gitcai
```

Then run:

```bash
gitcai
```

### From This Repository

```bash
git clone https://github.com/VanChung369/gitcai.git
cd gitcai
yarn install
yarn build
yarn link
```

Now the `gitcai` command is available globally on your machine.

## First-Time Setup

The first time you run:

```bash
gitcai
```

the tool asks for only the required setup:

- AI provider: `ollama` or `gemini`
- Commit message language: English or Vietnamese
- Provider-specific values:
  - Ollama: base URL and model
  - Gemini: API key and model

You can also run setup manually:

```bash
gitcai config setup
```

## Basic Usage

Go to any Git repository:

```bash
cd path/to/your/repo
```

Run:

```bash
gitcai
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
gitcai --push
```

Skip editing:

```bash
gitcai --no-edit
```

Skip confirmation:

```bash
gitcai --yes
```

Skip both editing and confirmation:

```bash
gitcai --no-edit --yes
```

Do not auto-stage files:

```bash
gitcai --no-stage
```

## Ollama Setup

Local Ollama:

```bash
gitcai config set provider ollama
gitcai config set ollamaUrl http://localhost:11434
gitcai config set model qwen2.5:1.5b
```

Remote Ollama:

```bash
gitcai config set provider ollama
gitcai config set ollamaUrl https://ai.example.com
gitcai config set model qwen2.5:1.5b
```

Use without saving config:

```bash
gitcai --provider ollama --ollama-url http://localhost:11434 --model qwen2.5:1.5b
```

## Gemini Setup

Save Gemini config:

```bash
gitcai config set provider gemini
gitcai config set model gemini-2.5-flash
gitcai config set geminiApiKey YOUR_API_KEY
```

Use an environment variable instead:

```bash
set GEMINI_API_KEY=YOUR_API_KEY
gitcai --provider gemini
```

On macOS or Linux:

```bash
export GEMINI_API_KEY=YOUR_API_KEY
gitcai --provider gemini
```

Use without saving config:

```bash
gitcai --provider gemini --gemini-api-key YOUR_API_KEY --model gemini-1.5-flash
```

## Config Commands

Run setup again:

```bash
gitcai config setup
```

Show all config:

```bash
gitcai config list
```

Get one value:

```bash
gitcai config get provider
```

Set one value:

```bash
gitcai config set language vi
gitcai config set thinking false
```

Reset config:

```bash
gitcai config reset
```

Show config file path:

```bash
gitcai config path
```

Config is stored in a user-level JSON file using `conf`. It is not committed to your project.

## Useful Options

```bash
gitcai --provider ollama
gitcai --provider gemini
gitcai --language en
gitcai --language vi
gitcai --max-length 125
gitcai --max-diff-chars 10000
gitcai --temperature 0.2
gitcai --thinking
gitcai --no-thinking
```

Thinking is disabled by default because commit messages should be one concise line. Enable it only if your selected model needs reasoning for better output.

Ollama-specific:

```bash
gitcai --num-predict 40
```

Gemini-specific:

```bash
gitcai --max-output-tokens 1280
```

## Troubleshooting

### `Current directory is not a Git repository`

Run the command inside a Git repository:

```bash
cd path/to/your/repo
gitcai
```

### Ollama Request Timeout

If your Ollama server is slow or behind a proxy, reduce the diff size:

```bash
gitcai --max-diff-chars 2000 --num-predict 30
```

### Gemini API Key Missing

Set the key:

```bash
gitcai config set geminiApiKey YOUR_API_KEY
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
gitcai --help
```

Unlink:

```bash
yarn unlink
```

## Security Notes

`gitcai` sends your staged diff to the configured AI provider. Do not use a remote provider for changes that contain secrets, credentials, private keys, or sensitive code.
