import * as path from "node:path";
import { IniFile, Project, Task, YamlFile } from "projen";
import { NodePackageManager, NodeProject } from "projen/lib/javascript";
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from "projen/lib/typescript";
import {
  ILinkableProjectCore,
  LinkableProject,
} from "../components/linkable-project";
import { NodePackageUtils } from "../util/node";
import { ProjectUtils } from "../util/project";

/**
 * Configuration options for the PnpmMonorepoProject.
 */
export interface PnpmMonorepoProjectOptions
  extends Omit<
    TypeScriptProjectOptions,
    "defaultReleaseBranch" | "packageManager"
  > {
  /**
   * The name of the main release branch.
   *
   * @default "main"
   */
  readonly defaultReleaseBranch?: string;

  /**
   * The concurrency level for workspace tasks.
   *
   * @default pnpm's default concurrency
   */
  readonly workspaceTasksConcurrency?: number;
}

/**
 * This project type will bootstrap a monorepo with support for polyglot
 * builds, build caching, dependency graph visualization and much more.
 */
export class PnpmMonorepoProject
  extends TypeScriptProject
  implements ILinkableProjectCore
{
  // immutable data structures
  private readonly workspacePackages: string[];
  private readonly workspaceTasksConcurrency?: number;

  private subNodeProjectResolves: Array<() => boolean> = [];

  /**
   * Constructs a new instance of the PnpmMonorepoProject.
   *
   * @param options - Configuration options for the PnpmMonorepoProject.
   */
  constructor(options: PnpmMonorepoProjectOptions) {
    const defaultReleaseBranch = options.defaultReleaseBranch ?? "main";
    super({
      ...options,
      packageManager: NodePackageManager.PNPM,
      github: options.github ?? false,
      package: options.package ?? false,
      projenCommand: NodePackageUtils.command.projen(NodePackageManager.PNPM),
      prettier: options.prettier ?? true,
      projenrcTs: true,
      release: options.release ?? false,
      jest: options.jest ?? false,
      sampleCode: false, // root should never have sample code,
      gitignore: [".tmp", ...(options.gitignore ?? [])],
      defaultReleaseBranch,
      eslintOptions: options.eslintOptions ?? {
        dirs: ["."],
        ignorePatterns: ["packages/**/*.*"],
      },
      tsconfig: options.tsconfig ?? {
        compilerOptions: {
          rootDir: ".",
        },
        include: ["**/*.ts", ".projenrc.ts"],
      },
    });

    this.workspaceTasksConcurrency = options.workspaceTasksConcurrency;

    // engines
    this.package.addEngine("node", ">=18");
    this.package.setScript(
      "install:ci",
      !this.ejected
        ? NodePackageUtils.command.exec(
            this.package.packageManager,
            "projen install:ci"
          )
        : "scripts/run-task install:ci"
    );

    this.package.addEngine("pnpm", ">=9 <10");
    if (options.pnpmVersion) {
      this.package.addField("packageManager", `pnpm@${options.pnpmVersion}`);
    }

    this.addDevDeps("tsx");
    this.defaultTask?.reset("tsx .projenrc.ts");

    this.workspacePackages = [];

    // Never publish a monorepo root package.
    this.package.addField("private", true);

    // Add alias task for "projen" to synthesize workspace
    !this.ejected &&
      this.package.setScript(
        "synth-workspace",
        NodePackageUtils.command.projen(this.package.packageManager)
      );

    if (options.scripts == null || options.scripts.build == null) {
      this.overridePnpmTask(
        this.buildTask,
        { target: "build" },
        { force: true }
      );
    }
    if (options.scripts == null || options.scripts["pre-compile"] == null) {
      this.overridePnpmTask(this.preCompileTask, {
        target: "pre-compile",
      });
    }
    if (options.scripts == null || options.scripts.compile == null) {
      this.overridePnpmTask(this.compileTask, {
        target: "compile",
      });
    }
    if (options.scripts == null || options.scripts["post-compile"] == null) {
      this.overridePnpmTask(this.postCompileTask, {
        target: "post-compile",
      });
    }
    if (options.scripts == null || options.scripts.test == null) {
      this.overridePnpmTask(this.testTask, {
        target: "test",
      });
    }
    if (options.scripts == null || options.scripts.eslint == null) {
      // The Projenrc component of TypeScriptProject resets the eslint task as part of preSynthesize which would undo
      // our changes, so we disable further resets.
      this.overridePnpmTask(
        this.eslint?.eslintTask,
        { target: "eslint" },
        { disableReset: true }
      );
    }
    if (options.scripts == null || options.scripts.package == null) {
      this.overridePnpmTask(this.packageTask, {
        target: "package",
      });
    }
    if (options.scripts == null || options.scripts.prepare == null) {
      this.overridePnpmTask("prepare", {
        target: "prepare",
      });
    }
    if (options.scripts == null || options.scripts.watch == null) {
      this.overridePnpmTask(this.watchTask, {
        target: "watch",
      });
    }
  }

  /**
   * Overrides a task with pnpm monorepo command.
   *
   * @param task - The task to override.
   * @param options - The options for the task override.
   * @param options.target - The target script to run.
   * @param overrideOptions - Additional options for overriding the task.
   * @param [overrideOptions.force] - Whether to force the override.
   * @param [overrideOptions.disableReset] - Whether to disable further resets.
   * @returns The overridden task or undefined if the task was not found.
   */
  private overridePnpmTask(
    task: Task | string | undefined,
    options: { target: string },
    overrideOptions?: { force?: boolean; disableReset?: boolean }
  ): Task | undefined {
    if (typeof task === "string") {
      task = this.tasks.tryFind(task);
    }

    if (task == null) {
      return;
    }

    if (overrideOptions?.force) {
      // @ts-ignore - private property
      task._locked = false;
    }

    const command = [
      "pnpm",
      "--recursive",
      this.workspaceTasksConcurrency
        ? `--workspace-concurrency=${this.workspaceTasksConcurrency}`
        : "",
      "run",
      options.target,
    ];

    task.reset(command.join(" "), { receiveArgs: true });

    task.description += " for all affected projects";

    if (overrideOptions?.disableReset) {
      // Prevent any further resets of the task to force it to remain as the pnpm command
      task.reset = () => {};
    }

    return task;
  }

  /**
   * @inheritdoc
   */
  public addImplicitDependency(
    dependent: Project,
    dependency: string | Project
  ): void {
    LinkableProject.ensure(dependent).addImplicitDependency(dependency);
  }

  /**
   * Add one or more additional package globs to the workspace.
   *
   * @param packageGlobs paths to the package to include in the workspace (for example packages/my-package)
   */
  public addWorkspacePackages(...packageGlobs: string[]) {
    // Any subprojects that were added since the last call to this method need to be added first, in order to ensure
    // we add the workspace packages in a sane order.
    const relativeSubProjectWorkspacePackages = this.sortedSubProjects
      .filter((s) => ProjectUtils.isNamedInstanceOf(s, NodeProject))
      .map((project) => path.relative(this.outdir, project.outdir));
    const existingWorkspacePackages = new Set(this.workspacePackages);
    this.workspacePackages.push(
      ...relativeSubProjectWorkspacePackages.filter(
        (pkg) => !existingWorkspacePackages.has(pkg)
      )
    );

    // Add the additional packages next
    this.workspacePackages.push(...packageGlobs);
  }

  /**
   * Get consistently sorted list of subprojects.
   *
   * @returns {Project[]} Sorted list of subprojects.
   */
  public get sortedSubProjects(): Project[] {
    return this.subprojects
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create symbolic links to all local workspace bins. This enables the usage of bins the same
   * way as consumers of the packages have when installing from the registry.
   */
  protected linkLocalWorkspaceBins(): void {
    const bins: [string, string][] = [];

    this.subprojects.forEach((subProject) => {
      if (
        ProjectUtils.isNamedInstanceOf(subProject, NodeProject) &&
        subProject.name !== "@aws/pdk"
      ) {
        const pkgBins: Record<string, string> =
          subProject.package.manifest.bin() || {};
        bins.push(
          ...Object.entries(pkgBins).map(([cmd, bin]) => {
            const resolvedBin = path.join(
              "$PWD",
              path.relative(this.outdir, subProject.outdir),
              bin
            );
            return [cmd, resolvedBin] as [string, string];
          })
        );
      }
    });

    const linkTask = this.addTask("workspace:bin:link", {
      steps: bins.map(([cmd, bin]) => ({
        exec: `ln -s ${bin} ${NodePackageUtils.command.bin(
          this.package.packageManager,
          cmd
        )} &>/dev/null; exit 0;`,
      })),
    });

    (this.tasks.tryFind("prepare") || this.addTask("prepare")).spawn(linkTask);
  }

  /**
   * Pre-synthesize operations for the project.
   */
  preSynthesize(): void {
    NodePackageUtils.removeProjenScript(this);

    if (
      !ProjectUtils.isNamedInstanceOf(this.root, NodeProject) &&
      !this.root.tryFindFile(".npmrc")
    ) {
      new IniFile(this.root, ".npmrc", {
        obj: {
          "resolution-mode": "highest",
          yes: "true",
          "prefer-workspace-packages": "true",
          "link-workspace-packages": "true",
        },
      }).synthesize();
    } else if (
      ProjectUtils.isNamedInstanceOf(this.root, NodeProject) &&
      this.root.package.packageManager === NodePackageManager.PNPM
    ) {
      this.root.npmrc.addConfig("prefer-workspace-packages", "true");
      this.root.npmrc.addConfig("link-workspace-packages", "true");
      this.root.npmrc.addConfig("yes", "true");
    }

    super.preSynthesize();

    this.subprojects.forEach((subProject) => {
      if (NodePackageUtils.isNodeProject(subProject)) {
        // Remove any subproject .npmrc files since only the root one matters
        subProject.tryRemoveFile(".npmrc");
        NodePackageUtils.removeProjenScript(subProject);
      }
    });
  }

  /**
   * @inheritDoc
   */
  synth() {
    this.validateSubProjects();
    this.updateWorkspace();

    // Prevent sub NodeProject packages from `postSynthesis` which will cause individual/extraneous installs.
    // The workspace package install will handle all the sub NodeProject packages automatically.
    this.subprojects.forEach((subProject) => {
      if (NodePackageUtils.isNodeProject(subProject)) {
        const subNodeProject: NodeProject = subProject as NodeProject;
        const subNodeProjectResolver =
          // @ts-ignore - private
          subNodeProject.package.resolveDepsAndWritePackageJson;
        // @ts-ignore - `installDependencies` is private
        subNodeProject.package.installDependencies = () => {
          this.subNodeProjectResolves.push(() =>
            subNodeProjectResolver.apply(subNodeProject.package)
          );
        };
        // @ts-ignore - private
        subNodeProject.package.resolveDepsAndWritePackageJson = () => {};
      }
    });

    this.subprojects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();
    });
    super.synth();
  }

  /**
   * @inheritDoc
   */
  postSynthesize(): void {
    super.postSynthesize();
    this.resolveSubNodeProjects();
  }

  /**
   * Resolve sub `NodePackage` dependencies.
   */
  private resolveSubNodeProjects() {
    if (this.subNodeProjectResolves.length) {
      if (!this.package.file.changed) {
        // Force workspace install deps since it would not have been invoked during `postSynthesis`.
        // @ts-ignore - `installDependencies` is private
        this.package.installDependencies();
      }
      const completedResolves = this.subNodeProjectResolves.map((resolve) =>
        resolve()
      );
      if (completedResolves.some(Boolean)) {
        // Indicates that a subproject dependency has been resolved from '*', so update the lockfile.
        // @ts-ignore - `installDependencies` is private
        this.package.installDependencies();
      }
    }
    this.subNodeProjectResolves = [];
  }

  /**
   * Ensures subprojects don't have a default task and that all packages use the same package manager.
   */
  private validateSubProjects() {
    this.subprojects.forEach((subProject: any) => {
      // Disable default task on subprojects as this isn't supported in a monorepo
      subProject.defaultTask?.reset();

      if (
        NodePackageUtils.isNodeProject(subProject) &&
        subProject.package.packageManager !== this.package.packageManager
      ) {
        throw new Error(
          `${subProject.name} packageManager does not match the monorepo packageManager: ${this.package.packageManager}.`
        );
      }
    });
  }

  /**
   * Add a submodule entry to the appropriate workspace file.
   */
  private updateWorkspace() {
    // A final call to addWorkspacePackages will update the list of workspace packages with any subprojects that have
    // not yet been added, in the correct order
    this.addWorkspacePackages();

    // Add workspaces for each subproject
    if (this.package.packageManager === NodePackageManager.PNPM) {
      new YamlFile(this, "pnpm-workspace.yaml", {
        readonly: true,
        obj: {
          packages: this.workspacePackages,
        },
      });
    }
  }
}
