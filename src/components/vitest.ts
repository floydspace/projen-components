import { Component, JsonFile, Project, TextFile, typescript } from "projen";
import { CSpell } from "./cspell";
import { VscodeExtensionRecommendations } from "./vscode-extension-recommendations";

const DEFAULT_TEST_REPORTS_DIR = "test-reports";

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
  /**
   * Result processing with junit.
   *
   * Output directory is `test-reports/`.
   *
   * @default true
   */
  readonly junitReporting?: boolean;
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

    project.testTask.prependExec("vitest run --passWithNoTests --update", {
      receiveArgs: true,
    });
    project.addTask("test:watch", {
      description: "Run tests in watch mode",
      exec: "vitest --watch",
    });

    const compilerOptions = project.tsconfigDev?.compilerOptions as any;

    if (compilerOptions && this.options?.globals) {
      compilerOptions.types = [
        ...(compilerOptions.types ?? []),
        "vitest/globals",
      ];
    }

    if (this.options?.junitReporting ?? true) {
      const reportsDir = DEFAULT_TEST_REPORTS_DIR;
      project.addGitIgnore(`/${reportsDir}/`);
      project.addGitIgnore("junit.xml");
      project.npmignore?.addPatterns(`/${reportsDir}/`);
      project.npmignore?.addPatterns("junit.xml");
    }

    project.addGitIgnore("/coverage/");
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
        ...(this.options?.junitReporting ?? true
          ? [
              `    reporters: ["default", ["junit", { outputFile: "${DEFAULT_TEST_REPORTS_DIR}/junit.xml" }]],`,
            ]
          : []),
        "  },",
        "});",
        "",
      ],
    });
    project.npmignore?.addPatterns("/vitest.config.ts");
    project.tsconfigDev.addInclude("vitest.config.ts");
    project.eslint?.addOverride({
      files: ["vitest.config.ts"],
      rules: { "import/no-extraneous-dependencies": "off" },
    });
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
