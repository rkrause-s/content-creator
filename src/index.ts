#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { config, validateConfig } from "./config.js";
import { runPipeline } from "./pipeline/runner.js";
import { listGenerators } from "./generators/registry.js";

const program = new Command();

program
  .name("content-creator")
  .description("Automated marketing content pipeline powered by Google Gemini")
  .version("1.0.0");

program
  .command("generate")
  .description("Run the full content pipeline: brief → plan → assets → review → export")
  .argument("<prompt>", "Campaign brief as free text")
  .option("-l, --language <lang>", "Content language (de/en)", config.defaultLanguage)
  .option("-o, --output <dir>", "Output directory", "output")
  .option("--skip-images", "Skip image generation via Gemini")
  .action(async (prompt: string, opts: { language: string; output: string; skipImages?: boolean }) => {
    try {
      validateConfig();
      console.log(chalk.bold("\n🚀 Content Creator Pipeline\n"));
      const state = await runPipeline(prompt, {
        language: opts.language,
        outputDir: opts.output,
        skipImages: opts.skipImages,
      });
      console.log(
        chalk.green(
          `\n✅ Campaign "${state.plan?.campaignName}" generated successfully!`
        )
      );
      console.log(`   Open ${chalk.underline(state.outputDir + "/preview/index.html")} to preview.\n`);
    } catch (err) {
      console.error(chalk.red(`\n❌ Error: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("plan")
  .description("Generate only the content plan (stages 1-2)")
  .argument("<prompt>", "Campaign brief as free text")
  .option("-l, --language <lang>", "Content language (de/en)", config.defaultLanguage)
  .action(async (prompt: string, opts: { language: string }) => {
    try {
      validateConfig();
      console.log(chalk.bold("\n📋 Content Creator - Plan Mode\n"));
      const state = await runPipeline(prompt, {
        language: opts.language,
        planOnly: true,
      });

      if (state.plan) {
        console.log(chalk.bold(`\n📌 ${state.plan.campaignName}\n`));
        console.log(state.plan.summary + "\n");
        console.log(chalk.bold("Content Pillars:"));
        for (const pillar of state.plan.pillars) {
          console.log(`  • ${chalk.cyan(pillar.name)}: ${pillar.description}`);
        }
        console.log(chalk.bold("\nPlanned Assets:"));
        for (const asset of state.plan.assets) {
          console.log(`  ${chalk.yellow(asset.id)} ${asset.title}`);
          console.log(`    Angle: ${asset.angle}`);
        }
      }
      console.log();
    } catch (err) {
      console.error(chalk.red(`\n❌ Error: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

program
  .command("list-assets")
  .description("List all available asset types")
  .action(() => {
    console.log(chalk.bold("\n📦 Available Asset Types\n"));
    for (const gen of listGenerators()) {
      console.log(`  ${chalk.cyan(gen.type.padEnd(22))} ${gen.label}`);
      console.log(`  ${"".padEnd(22)} ${chalk.dim(gen.description)}`);
      console.log();
    }
  });

program.parse();
