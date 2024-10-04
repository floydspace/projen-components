import fs from "node:fs";
import path from "node:path";

import { Component, JsonFile, Project, YamlFile, javascript } from "projen";

/**
 * Options for configuring the Changesets component.
 */
export interface ChangesetsOptions {
  /**
   * The name of the main release branch.
   *
   * @default "main"
   */
  readonly defaultReleaseBranch: string;

  /**
   * The GitHub repository in "org/repo" format.
   */
  readonly repo: string;

  /**
   * If true, only update peer dependencies when they are out of range.
   */
  readonly onlyUpdatePeerDependentsWhenOutOfRange?: boolean;

  /**
   * Should provenance statements be generated when the package is published.
   *
   * @see https://docs.npmjs.com/generating-provenance-statements
   * @default - false
   */
  readonly npmProvenance?: boolean;
}

/**
 * A component that integrates Changesets into a NodeProject.
 */
export class Changesets extends Component {
  /**
   * Retrieves the Changesets component from the given project, if it exists.
   *
   * @param project The project to search for the Changesets component.
   * @returns The Changesets component, or undefined if it does not exist.
   */
  public static of(project: Project): Changesets | undefined {
    const isChangesets = (o: Component): o is Changesets =>
      o instanceof Changesets;
    return project.components.find(isChangesets);
  }

  private readonly nodeProject: javascript.NodeProject;

  /**
   * Creates an instance of the Changesets component.
   *
   * @param project The NodeProject to integrate with Changesets.
   * @param options Configuration options for the Changesets component.
   */
  constructor(project: javascript.NodeProject, options: ChangesetsOptions) {
    super(project);

    this.nodeProject = project;

    if (project.release) {
      throw new Error(
        "Cannot add the Changesets component to a project that already has a 'release' configuration."
      );
      // project.node.tryRemoveChild(project.release.node.id);
      // project.node.tryRemoveChild(project.release.publisher.node.id);
      // project.removeTask("release");

      // const version = project.components.find((c) => c instanceof Version);
      // if (version) {
      //   version.node.tryRemoveChild(version.node.id);
      //   project.deps.removeDependency("commit-and-tag-version");
      //   project.removeTask("bump");
      //   project.removeTask("unbump");

      //   const changelogFile = path.posix.join(
      //     project.release.artifactsDirectory,
      //     version.changelogFileName
      //   );
      //   const bumpFile = path.posix.join(
      //     project.release.artifactsDirectory,
      //     version.versionFileName
      //   );
      //   project.gitignore.removePatterns(`/${changelogFile}`);
      //   project.gitignore.removePatterns(`/${bumpFile}`);
      //   project.npmignore?.removePatterns(`/${changelogFile}`);
      //   project.npmignore?.removePatterns(`/${bumpFile}`);
      // }

      // project.components.forEach((c) => {
      //   if (c instanceof GithubWorkflow) {
      //     project.node.tryRemoveChild(c.node.id);
      //     c.file && project.node.tryRemoveChild(c.file.node.id);
      //   }
      // });
    }

    const branchName = options.defaultReleaseBranch ?? "main";

    // preserve the version number set by @changesets/cli
    const prev = this.readProjectPackageJson(project) ?? {};
    if (prev.version) {
      project.package.addVersion(prev.version);
    }

    project.addDevDeps("@changesets/changelog-github", "@changesets/cli");

    project.addTask("bump", {
      description: "Bump package versions with changesets",
      steps: [{ exec: "changeset version" }, { spawn: "install" }],
    });

    project.addTask("changeset", {
      exec: "changeset",
      receiveArgs: true,
    });

    new JsonFile(project, ".changeset/config.json", {
      obj: {
        $schema: "https://unpkg.com/@changesets/config@2.3.1/schema.json",
        changelog: ["@changesets/changelog-github", { repo: options.repo }],
        commit: false,
        fixed: [],
        linked: [],
        access: "restricted",
        baseBranch: branchName,
        updateInternalDependencies: "patch",
        ignore: [],
        ___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH: {
          ...(options.onlyUpdatePeerDependentsWhenOutOfRange
            ? { onlyUpdatePeerDependentsWhenOutOfRange: true }
            : {}),
        },
      },
      omitEmpty: true,
    });

    project.addPackageIgnore("/.changeset/");

    new YamlFile(project, ".github/workflows/release.yml", {
      obj: {
        name: "release",
        on: {
          push: { branches: [branchName] },
          workflow_dispatch: {}, // allow manual triggering
        },
        concurrency: {
          group: "${{ github.workflow }}-${{ github.ref }}",
        },
        jobs: {
          release: {
            "runs-on": "ubuntu-latest",
            permissions: {
              "pull-requests": "write",
              ...(options.npmProvenance
                ? {
                    "id-token": "write",
                    contents: "write",
                  }
                : {}),
            },
            steps: [
              {
                name: "Checkout",
                uses: "actions/checkout@v4",
                with: { "fetch-depth": 0 },
              },
              {
                name: "Setup Node.js 20",
                uses: "actions/setup-node@v3",
                with: { "node-version": "20.x" },
              },
              {
                name: "Setup pnpm",
                uses: "pnpm/action-setup@v3",
                with: { version: "8" },
              },
              {
                name: "Install dependencies",
                run: "pnpm i --frozen-lockfile",
              },
              { name: "Build", run: "pnpm build" },
              {
                name: "Upload coverage to Codecov",
                uses: "codecov/codecov-action@v4",
                with: { directory: "coverage" },
                env: {
                  CODECOV_TOKEN: "${{ secrets.CODECOV_TOKEN }}",
                },
              },
              {
                name: "Prepare Changeset",
                run: "pnpm changeset pre ${{ github.ref == 'refs/heads/main' && 'exit' || 'enter next' }} || echo 'swallow'",
              },
              {
                name: "Create Release Pull Request or Publish",
                uses: "changesets/action@v1",
                with: {
                  version: "pnpm bump",
                  publish: "pnpm changeset publish",
                  commit: "chore(release): version packages",
                },
                env: {
                  GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                  NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                  ...(options.npmProvenance
                    ? { NPM_CONFIG_PROVENANCE: "true" }
                    : {}),
                },
              },
            ],
          },
        },
      },
      committed: true,
    });
  }

  /**
   * Pre-synthesize hook to preserve version numbers set by @changesets/cli.
   */
  preSynthesize(): void {
    for (const subproject of this.nodeProject.subprojects) {
      if (subproject instanceof javascript.NodeProject) {
        // preserve the version number set by @changesets/cli
        const prev = this.readProjectPackageJson(subproject) ?? {};
        if (prev.version) {
          subproject.package.addVersion(prev.version);
        }
      }
    }
  }

  /**
   * Reads the package.json file of the given NodeProject.
   *
   * @param project The NodeProject to read the package.json from.
   * @returns The parsed package.json content, or undefined if the file does not exist.
   */
  private readProjectPackageJson(project: javascript.NodeProject) {
    const file = path.join(project.outdir, "package.json");

    if (!fs.existsSync(file)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(file, "utf-8"));
  }
}
