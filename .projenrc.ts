import { NodePackageManager, NpmAccess } from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";
import {
  Recommended,
  Organisational,
  CodeOfConduct,
  GitHubber,
  NpmReleaser,
} from "./src";

const gitHubber = new GitHubber({
  name: "projen-components",
  username: "floydspace",
});

const npmReleaser = new NpmReleaser(gitHubber, {
  scope: "floydspace",
  access: NpmAccess.PUBLIC,
  release: true,
});

const organisational = new Organisational({
  organisation: {
    name: "Mountain Pass",
    email: "info@mountain-pass.com.au",
    url: "https://mountain-pass.com.au",
  },
});

const project = new TypeScriptProject({
  ...gitHubber.nodeProjectOptions(),
  ...organisational.nodeProjectOptions(),
  ...npmReleaser.nodeProjectOptions(),
  ...Recommended.defaultProjectOptions,
  description: "A collection of cool projen components",
  typescriptVersion: "5.5.4",
  peerDeps: ["projen@>0.58.15"],
  peerDependencyOptions: { pinnedDevDependency: false },
  bundledDeps: [
    "merge",
    "traverse",
    "fs-extra",
    "shelljs",
    "cspell",
    "@cspell/cspell-types",
    "shelljs-plugin-authors",
    "@commitlint/config-conventional",
    "@commitlint/cli",
    "@commitlint/types",
  ],
  devDeps: [
    "@types/traverse",
    "@types/shelljs",
    "@commitlint/types",
    "@types/fs-extra",
  ],
  keywords: [
    "typescript",
    "projen",
    "projen-component",
    "projen-components",
    "cspell",
    "eslint-jsdoc",
    "prettier",
    "eslint-unicorn",
    "husky",
    "vscode-extension-recommendations",
  ],
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.PNPM,
  pnpmVersion: "8",
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
    },
  },
  projenrcTs: true,
  license: "Apache-2.0",
  codeCov: true,
  // buildWorkflowTriggers: {
  //   pullRequest: {},
  //   workflowDispatch: {},
  //   push: { branches: ["main"] },
  // },
  docgen: true,
  eslintOptions: {
    dirs: ["."],
  },
  dependabot: true,
  dependabotOptions: {
    labels: ["auto-approve"],
  },
  jestOptions: {
    configFilePath: "jest.config.json",
    jestConfig: {
      coverageThreshold: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ["dependabot[bot]"],
    label: "auto-approve",
    secret: "GITHUB_TOKEN",
  },
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: [
          "build",
          "chore",
          "ci",
          "docs",
          "feat",
          "fix",
          "perf",
          "refactor",
          "revert",
          "style",
          "test",
        ],
      },
    },
  },
});
organisational.addToProject(project);

new Recommended(project, {
  cSpellOptions: {
    language: "en-GB",
    overrides: [
      {
        language: "en",
        filename: "code-of-conduct-text/contributor-covenant-2.1.md",
        words: ["socio-economic"],
      },
    ],
  },
});

gitHubber.addToProject(project);
npmReleaser.addToProject(project);

new CodeOfConduct(project, { contactMethod: "tom@mountain-pass.com.au" });

project.addGitIgnore("/docs");
project.package.addEngine("pnpm", ">=8 <9");

project.synth();
