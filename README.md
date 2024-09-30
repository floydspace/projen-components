# @floydspace/projen-components

A collection of cool projen components

[![License](https://img.shields.io/github/license/floydspace/projen-components?logo=apache)](https://github.com/floydspace/projen-components/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/@floydspace/projen-components?logo=npm)](https://www.npmjs.com/package/@floydspace/projen-components) [![npm downloads](https://img.shields.io/npm/dm/@floydspace/projen-components?logo=npm)](https://www.npmjs.com/package/@floydspace/projen-components)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Ffloydspace%2Fprojen-components.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Ffloydspace%2Fprojen-components?ref=badge_shield)

[![Build Status](https://img.shields.io/github/workflow/status/floydspace/projen-components/release?logo=github)](https://github.com/floydspace/projen-components/actions/workflows/release.yml) [![GitHub issues](https://img.shields.io/github/issues/floydspace/projen-components?logo=github)](https://github.com/floydspace/projen-components/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/floydspace/projen-components?logo=github)](https://github.com/floydspace/projen-components/pulls)

<!-- [![Quality](https://img.shields.io/codacy/grade/940768d54f7545f7b42f89b26c23c751?logo=codacy)](https://www.codacy.com/gh/floydspace/projen-components/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=floydspace/projen-components&amp;utm_campaign=Badge_Grade) [![Coverage](https://img.shields.io/codacy/coverage/940768d54f7545f7b42f89b26c23c751?logo=codacy)](https://www.codacy.com/gh/floydspace/projen-components/dashboard?utm_source=github.com&utm_medium=referral&utm_content=floydspace/projen-components&utm_campaign=Badge_Coverage) -->

[![source code vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/floydspace/projen-components?label=source%20code%20vulnerabilities&logo=snyk)](https://snyk.io/test/github/floydspace/projen-components) [![npm package vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@floydspace/projen-components@latest?label=npm%20package%20vulnerabilties&logo=snyk)](https://snyk.io/test/npm/@floydspace/projen-components/latest)

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

![I love badges](https://img.shields.io/badge/%E2%99%A5%20i%20love-%20badges-green?logo=heart)

<!-- [![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard) -->

## Installation & Usage

1. If you don't have projen installed and configured, you'll need to [go do that first](https://github.com/projen/projen#getting-started).

2. Add `@floydspace/projen-components` to you development dependencies. e.g., in your `.projenrc.ts`

```ts
const project = new TypeScriptProject({
  //...
  devDeps: [
    //...
    "@floydspace/projen-components",
  ],
  //...
});
```

or

```ts
const project = new TypeScriptProject({
  //...
});
project.addDevDeps("@floydspace/projen-components");
```

3. Run `npx projen` to regenerate the project files

4. Add the components to you project in your `.projenrc.ts` file. For
   example, to add all the recommended components, add `Recommended`

```ts
import { Recommended } from "@floydspace/projen-components";

//...

const project = new TypeScriptProject({
  ...Recommended.defaultProjectOptions,
  //...
});

new Recommended(project);

//...

project.synth();
```

or you can add individual components

```ts
import { Husky, EslintUnicorn } from "@floydspace/projen-components";

//...

const project = new TypeScriptProject({
  ...EslintUnicorn.defaultProjectOptions,
  //...
});

new Husky(project);
new EslintUnicorn(project);

//...

project.synth();
```

5. Run `npx projen` to generate the project files

## Components

| Component                            | Functionality                                                                                                                                                                                                                                                                                                                                                                          | Uses                                                                             | Base Project Type Required | Included in Recommended |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------- | ----------------------- |
| **`CodeOfConduct`**                  | Add a [Contributor Covenant](https://www.contributor-covenant.org/) v2.1 `CODE_OF_CONDUCT.md` to your project.<br />**\*NOTE:** `CodeOfConduct` is not automatically included in the `Recommended` component because we believe adopting the Contributor Covenant should be a conscious deliberate decision and not something done inadvertently. We actively recommend its adoption\* |                                                                                  | Project                    |                         |
| **`Commitlint`**                     | Checks if your commit messages meet the [conventional commit format](https://conventionalcommits.org/).                                                                                                                                                                                                                                                                                | [commitlint](https://github.com/conventional-changelog/commitlint)               | NodeProject                | ✅                      |
| **`Contributors`**                   | Adds github authors to the project's contributors list                                                                                                                                                                                                                                                                                                                                 | [shelljs-plugin-authors](https://github.com/tanem/shelljs-plugin-authors)        | NodeProject                | ✅                      |
| **`CSpell`**                         | Provides spell checking for your code and your commit messages                                                                                                                                                                                                                                                                                                                         | [cspell](https://github.com/streetsidesoftware/cspell)                           | NodeProject                | ✅                      |
| **`EslintIgnore`**                   | Creates an ESLint ignore file containing the projen generated files                                                                                                                                                                                                                                                                                                                    |                                                                                  | TypeScriptProject          | ✅                      |
| **`EslintJsdoc`**                    | Provides JSDoc specific linting rules for ESLint                                                                                                                                                                                                                                                                                                                                       | [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)              | TypeScriptProject          | ✅                      |
| **`EslintJsonC`**                    | Provides linting of JSON files                                                                                                                                                                                                                                                                                                                                                         | [eslint-plugin-jsonc](https://ota-meshi.github.io/eslint-plugin-jsonc/)          | TypeScriptProject          | ✅                      |
| **`EslintNoSecrets`**                | Adds an eslint plugin to find strings that might be secrets/credentials                                                                                                                                                                                                                                                                                                                | [eslint-plugin-no-secrets](https://github.com/nickdeis/eslint-plugin-no-secrets) | TypeScriptProject          | ✅                      |
| **`EslintPrettierFixer`**            | Ensures `prettier` is the last entry in your eslint `extends` section, which is needed for prettier to work correctly with eslint                                                                                                                                                                                                                                                      |                                                                                  | TypeScriptProject          | ✅                      |
| **`EslintUnicorn`**                  | Provides more than 100 powerful ESLint rules                                                                                                                                                                                                                                                                                                                                           | [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)   | TypeScriptProject          |                         |
| **`Husky`**                          | Git hooks made easy 🐶 woof!                                                                                                                                                                                                                                                                                                                                                           | [husky](https://github.com/typicode/husky)                                       | NodeProject                | ✅                      |
| **`OnlyAllow`**                      | Only allow project package manager to be used                                                                                                                                                                                                                                                                                                                                          | [only-allow](https://github.com/pnpm/only-allow)                                 | NodeProject                |                         |
| **`Recommended`**                    | Includes all the "included in recommended" components in this table                                                                                                                                                                                                                                                                                                                    |                                                                                  | TypeScriptProject          |                         |
| **`VscodeExtensionRecommendations`** | Manages vscode extension recommendations for your project                                                                                                                                                                                                                                                                                                                              |                                                                                  | Project                    | ✅                      |

## Pseudo-Components

Pseudo-Components behave like components but are created _before_ the project. This is needed in situations where the project options are being generated.

| Pseudo-Component     | Functionality                                                                              | Base Project Type Required |
| -------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| **`GitHubber`**      | The `GitHubber` pseudo-component add github repo, issues and homepage URLs to your project | NodeProject                |
| **`NpmReleaser`**    | The `NpmReleaser` pseudo-component add npm release data to the project                     | NodeProject                |
| **`Organisational`** | The `Organisational` pseudo-component add organisation based author data to the project    | NodeProject                |

### Pseudo-Component Usage

Pseudo-Components are constructed and then added to the project using the `addToProject()` method

```ts
import { Organisational } from "@floydspace/projen-components";
const organisational = new Organisational({
  organisation: {
    name: "Mountain Pass",
    email: "info@mountain-pass.com.au",
    url: "https://mountain-pass.com.au",
  },
});
const project = new TypeScriptProject(
  ...organisational.nodeProjectOptions()
  //...
);
// NOTE: The follow step is needed for Pseudo-Components, otherwise
// their `preSynthesize()`, `synthesize()`, and `postSynthesize()`
// methods will not be called
organisational.addToProject(project);
```
