#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ quiet: true, debug: false });

import path from 'path';
import { setLocale } from "@ssww.one/l4";
import { EmbeddingModel, runProgram } from "./executor";
import { OpenAILLM } from "@ssww.one/framework";
import { readFileSync } from "node:fs";

const file_input_path = process.argv[2];
const initial_context = process.argv[3];
if (!file_input_path) {
  console.error("Please provide .l4 file input");
  process.exit(0);
}

const abs_path = path.resolve(file_input_path);
const source = readFileSync(abs_path, 'utf-8');

const relative_dir = path.dirname(abs_path);

setLocale(process.env.LOCALE as ('en' | 'id') || 'id');
const llm = new OpenAILLM({
  base_url: process.env.OPENAI_BASEURL || '',
  apiKey: process.env.OPENAI_APIKEY || '',
  model: process.env.OPENAI_MODEL || '',
});
const semantic_model: EmbeddingModel = { type: 'none', value: '' };
if (process.env.LOCAL_EMBEDDING_MODEL) {
  semantic_model.type = 'local';
  semantic_model.value = process.env.LOCAL_EMBEDDING_MODEL;
} else {
  if (process.env.HOSTED_EMBEDDING_MODEL) {
    semantic_model.type = 'hosted';
    semantic_model.value = process.env.HOSTED_EMBEDDING_MODEL;
  } else {
    if (process.env.OPENAI_VECTOR_MODEL) {
      semantic_model.type = 'openai';
      semantic_model.value = process.env.OPENAI_VECTOR_MODEL;
    }
  }
}
runProgram({
  source,
  llm,
  relative_dir,
  initial_context,
  semantic_model
}).then(s => { }).catch(console.error).finally(() => process.exit(0));
