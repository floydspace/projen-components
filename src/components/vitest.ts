import { Component, JsonFile, Project, TextFile, typescript } from "projen";
import { CSpell } from "./cspell";
import { VscodeExtensionRecommendations } from "./vscode-extension-recommendations";

/**
 * Options for configuring the Vitest component.
 */
export interface VitestOptions {
  /**
   * Enable the Vitest global variables.
   *
   * @default false
   */
  readonly globals?: boolean;
  /**
   * Define the secret name for a specified https://codecov.io/ token
   * A secret is required to send coverage for private repositories
   *
   * @default - if this option is not specified, only public repositories are supported
   */
  readonly codeCovTokenSecret?: string;
}

/**
 * replaces jest with vitest
 */
export class Vitest extends Component {
  /**
   * Retrieves the Vitest component from the given project, if it exists.
   *
   * @param project The project to search for the Vitest component.
   * @returns The Vitest component or undefined if not found.
   */
  public static of(project: Project): Vitest | undefined {
    const isVitest = (o: Component): o is Vitest => o instanceof Vitest;
    return project.components.find(isVitest);
  }

  /**
   * Creates an instance of the Vitest component.
   *
   * @param project The TypeScript project to which this component belongs.
   * @param options The Vitest component options.
   */
  constructor(
    project: typescript.TypeScriptProject,
    private readonly options?: VitestOptions
  ) {
    super(project);

    if (project.jest) {
      throw new Error(
        "Cannot add the Vitest component to a project that already has a 'jest' configuration."
      );
    }

    if (this.options?.codeCovTokenSecret) {
      project.buildWorkflow?.addPostBuildSteps(
        ...(project as any).renderUploadCoverageJobStep.call(
          { jest: { config: { coverageDirectory: "coverage" } } },
          { codeCovTokenSecret: this.options.codeCovTokenSecret }
        )
      );
    }

    project.addDevDeps("vitest", "@vitest/coverage-v8");

    project.testTask.prependExec("vitest run --passWithNoTests", {
      receiveArgs: true,
    });
    project.addTask("test:watch", {
      description: "Run tests in watch mode",
      exec: "vitest --watch --passWithNoTests",
    });

    const compilerOptions = project.tsconfigDev?.compilerOptions as any;

    if (compilerOptions && this.options?.globals) {
      compilerOptions.types = [
        ...(compilerOptions.types ?? []),
        "vitest/globals",
      ];
    }

    project.addGitIgnore("/test-reports/");
    project.addGitIgnore("junit.xml");
    project.addGitIgnore("/coverage/");
    project.npmignore?.addPatterns("/test-reports/");
    project.npmignore?.addPatterns("junit.xml");
    project.npmignore?.addPatterns("/coverage/");

    new TextFile(this, "vitest.config.ts", {
      lines: [
        'import { defineConfig } from "vitest/config";',
        "",
        "export default defineConfig({",
        "  test: {",
        ...(this.options?.globals ? ["    globals: true,"] : []),
        '    include: ["{src,test}/**/*.{test,spec}.?(c|m)[jt]s?(x)"],',
        "    coverage: {",
        "      enabled: true,",
        '      reporter: ["json", "lcov", "clover", "cobertura", "text"],',
        '      include: ["src/**/*.?(c|m)[jt]s?(x)"],',
        "    },",
        '    reporters: ["default", ["junit", { outputFile: "test-reports/junit.xml" }]],',
        "  },",
        "});",
        "",
      ],
    });
    project.npmignore?.addPatterns("/vitest.config.ts");
  }

  /**
   * adds vitest to the subprojects
   */
  preSynthesize(): void {
    if (this.project.subprojects.length > 0) {
      new JsonFile(this, "vitest.workspace.json", {
        obj: ["packages/*"],
        omitEmpty: true,
      });
      (this.project as typescript.TypeScriptProject).npmignore?.addPatterns(
        "/vitest.workspace.json"
      );
    }

    this.project.subprojects.forEach((subproject) => {
      if (subproject instanceof typescript.TypeScriptProject) {
        if (subproject.jest) {
          throw new Error(
            "Cannot add the Vitest component to a project that already has a 'jest' configuration."
          );
        }

        subproject.addDevDeps("vitest");
        subproject.testTask.exec("vitest run", {
          receiveArgs: true,
        });
        subproject.addTask("test:watch", {
          description: "Run tests in watch mode",
          exec: "vitest --watch --passWithNoTests --reporter verbose",
        });
      }
    });

    CSpell.of(this.project)?.addWords("vitest");
    VscodeExtensionRecommendations.of(this.project)?.addRecommendations(
      "vitest.explorer"
    );
  }
}
