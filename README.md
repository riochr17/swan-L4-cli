# Swan L4 CLI

An interpreter and CLI runner for the **Swan L4 DSL**, a domain-specific language designed for building and executing LLM-driven agents, tools, and interactive workflows.

## Table of Contents

- [Overview](#overview)
- [Examples](#examples)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Language Features](#language-features)
- [Editor Extensions](#editor-extensions)

## Overview

Swan L4 is a structured text-based language that lets you program step-by-step logic, manage execution state, invoke LLM queries, branch conditionally, and coordinate nested agent behaviors. 

`@ssww.one/l4cli` compiles and executes these `.l4` scripts directly from your terminal.

Read full language specification on [Swan L4 Language Specifications](https://github.com/riochr17/swan-L4/blob/master/SPECIFICATIONS.md)

## Examples

````l4
TITLE Greeting Program

SAY Welcome to the test environment!
LISTEN
THINK Extract the user's name from this text.
SAY Nice to meet you, {Context}!
````

See more examples on [example-l4](example-l4/) folder


## Installation

### Globally via npm

You can install the CLI globally from npm:

```bash
npm install -g @ssww.one/l4cli
```

### Pre-compiled Standalone Binaries

Alternatively, you can download pre-compiled standalone executables for Linux, macOS, and Windows directly from the [v0.0.8-alpha Release Page](https://github.com/riochr17/swan-L4-cli/releases/tag/0.0.8-alpha).

### Local Development Setup

If you want to run or build the project from source:

```bash
# Install dependencies
npm install

# Build the TypeScript files and link the binary globally
npm run build
```

This registers the `l4cli` binary command globally on your system.

### Compiling Standalone Binaries (Bun)

To compile self-contained executables for all major OSes/architectures (Linux, macOS, and Windows) using Bun:

```bash
# Compile binaries into the ./bin directory
npm run build:bin
```

## Configuration

The interpreter requires access to an OpenAI-compatible API to resolve LLM calls (`THINK`, `SAY THINK`, `IF`, etc.). Define the following environment variables in a `.env` file in your execution directory or export them in your shell:

```env
OPENAI_BASEURL=https://your-llm-provider-endpoint/v1
OPENAI_APIKEY=your-api-key
OPENAI_MODEL=your-model-name

# Optional: Locale configuration ('id' or 'en'). Defaults to 'id'.
LOCALE=en

# Optional: only if you use FIND keyword
LOCAL_EMBEDDING_MODEL=./my-model-folder/all-MiniLM-L6-v2
HOSTED_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
OPENAI_VECTOR_MODEL=your-vector-model-name
```

On `HOSTED_EMBEDDING_MODEL` embedding model will be downloaded when first FIND operation found.

Embedding model priority: `LOCAL_EMBEDDING_MODEL`, `HOSTED_EMBEDDING_MODEL`, `OPENAI_VECTOR_MODEL`

## Usage

Once built and configured, execute any `.l4` script using the CLI:

```bash
l4cli path/to/script.l4
```

## Language Features

The execution, syntax, features, and tokenization/parsing specifications for the Swan L4 DSL are backed by the core parser and tokenizer located in the separate repository: [swan-L4](https://github.com/riochr17/swan-L4).

### Core DSL Features
- **Indentation-based Scoping**: Automatically detects majority-based indentation (spaces or tabs) to determine scope and block execution.
- **Strict Sequencing**: Enforces structured script ordering (`TITLE` → `#DEFINE` → Executable Statements).
- **Macro & Agent Calls**: Supports `#DEFINE` directives for external API endpoints starting with `CALL_` and agent routing starting with `AGENT_`.
- **Implicit Context Pipeline**: Seamlessly tracks state through the global `Context` variable and processes `{Context}` template interpolation inside string arguments.
- **Localized Error Diagnostics**: Supports multi-language translation (English and Indonesian) for syntax and semantic parser errors.

Please check out the [swan-L4 repository](https://github.com/riochr17/swan-L4) for more information on the core language specifications, grammar details, parser features, and implementation files.

## Editor Extensions

For syntax highlighting and language support when writing `.l4` scripts, you can search for **"SWAN L4 Language Support"** in your editor's extension search panel, or install it directly:

- **VS Code**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=NaivDeveloper.swan-l4-vscode)
- **VSCodium**: [Open VSX Registry](https://open-vsx.org/extension/NaivDeveloper/swan-l4-vscode)
