import { Component, JsonFile, Project, javascript, typescript } from "projen";
import { CSpell } from "./cspell";
import { VscodeExtensionRecommendations } from "./vscode-extension-recommendations";

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
   */
  constructor(project: typescript.TypeScriptProject) {
    super(project);

    if (project.jest) {
      removeNode(project.jest.node.id, project);
    }

    project.addDevDeps("vitest", "@vitest/coverage-v8");

    project.testTask.reset("vitest --globals", { receiveArgs: true });

    const compilerOptions = project.tsconfig?.compilerOptions as any;

    if (compilerOptions) {
      compilerOptions.types = [
        ...(compilerOptions.types ?? []),
        "vitest/globals",
      ];
    }

    new JsonFile(project, "vitest.workspace.json", {
      obj: ["packages/*"],
      omitEmpty: true,
    });
  }

  /**
   * adds vitest to the subprojects
   */
  preSynthesize(): void {
    this.project.subprojects.forEach((subproject) => {
      if (subproject instanceof typescript.TypeScriptProject) {
        if (subproject.jest) {
          removeNode(subproject.jest.node.id, subproject);
        }

        subproject.addDevDeps("vitest");
        subproject.testTask.exec("vitest run --globals", { receiveArgs: true });
        subproject.addTask("test:watch", {
          description: "Run tests in watch mode",
          exec: "vitest --globals --passWithNoTests --reporter verbose",
        });
      }
    });

    CSpell.of(this.project)?.addWords("vitest");
    VscodeExtensionRecommendations.of(this.project)?.addRecommendations(
      "vitest.explorer"
    );
  }
}

/**
 * Removes a node from the project and resets the Jest state.
 *
 * @param nodeId - The ID of the node to remove.
 * @param project - The project from which to remove the node.
 */
function removeNode(nodeId: string, project: javascript.NodeProject) {
  project.node.tryRemoveChild(nodeId);
  resetProjectJestState(project);
}

/**
 * Resets the Jest state for the given project.
 *
 * @param project - The project for which to reset the Jest state.
 */
function resetProjectJestState(project: javascript.NodeProject) {
  unannotateGenerated.call(project.root, "*.snap");
  project.deps.removeDependency("jest");
  project.deps.removeDependency("jest-junit");
  project.deps.removeDependency("@types/jest");
  project.deps.removeDependency("ts-jest");
  project.gitignore.removePatterns(
    "# jest-junit artifacts",
    "/test-reports/",
    "junit.xml",
    "/coverage/"
  );
  project.npmignore?.removePatterns(
    "# jest-junit artifacts",
    "/test-reports/",
    "junit.xml",
    "/coverage/"
  );
  delete project.manifest.jest;
  if (project.jest?.file) {
    project.node.tryRemoveChild(project.jest.file.node.id);
    project.npmignore?.removePatterns(`/${project.jest.file.path}`);
  }
  project.testTask.removeStep(0);
  project.removeTask("test:watch");
}

/**
 * Removes the 'linguist-generated' attribute from the specified glob pattern in the .gitattributes file.
 *
 * @param this - The project in which to unannotate the generated files.
 * @param glob - The glob pattern to match files.
 */
function unannotateGenerated(this: Project, glob: string): void {
  removeAttributes.call(this.gitattributes, glob, "linguist-generated");
}

/**
 * Removes specified attributes from the given glob pattern in the .gitattributes file.
 *
 * @param this - The context in which to remove attributes.
 * @param glob - The glob pattern to match files.
 * @param attributes - The attributes to remove.
 */
function removeAttributes(this: any, glob: string, ...attributes: string[]) {
  if (!this.attributes.has(glob)) {
    return;
  }
  const set = this.attributes.get(glob)!;
  for (const attribute of attributes) {
    set.delete(attribute);
  }
  if (set.size === 0) {
    this.attributes.delete(glob);
  }
}
