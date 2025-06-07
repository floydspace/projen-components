import { Component, Project } from "projen";
import { ProjectUtils } from "../util/project";

/**
 * Interface that all LinkableProject implementations should implement.
 */
export interface ILinkableProjectCore {
  /**
   * Create an implicit dependency between two Projects. This is typically
   * used in polyglot repos where a Typescript project wants a build dependency
   * on a Python project as an example.
   *
   * @param dependent project you want to have the dependency.
   * @param dependency project you wish to depend on.
   * @throws error if this is called on a dependent which does not have a LinkableProject component attached.
   */
  addImplicitDependency(dependent: Project, dependency: Project | string): void;
}

/**
 * Component which manages the project specific linkable config and is added to all PnpmMonorepo subprojects.
 */
export class LinkableProject extends Component implements ILinkableProjectCore {
  /**
   * Retrieves an instance of LinkableProject if one is associated to the given project.
   *
   * @param project project instance.
   * @returns an instance of LinkableProject or undefined if not found.
   */
  static of(project: Project): LinkableProject | undefined {
    return project.components.find((c) =>
      ProjectUtils.isNamedInstanceOf(c, LinkableProject)
    ) as LinkableProject | undefined;
  }

  /**
   * Retrieves an instance of LinkableProject if one is associated to the given project,
   * otherwise created a LinkableProject instance for the project.
   *
   * @param project project instance.
   * @returns an instance of LinkableProject.
   */
  static ensure(project: Project): LinkableProject {
    return LinkableProject.of(project) || new LinkableProject(project);
  }

  /**
   * Implicit dependencies
   */
  public implicitDependencies: string[] = [];

  /**
   * Constructs a new instance of the LinkableProject component.
   *
   * @param project The project to associate with this component.
   * @throws Error if the project already has an associated LinkableProject component.
   */
  constructor(project: Project) {
    // Make sure we only ever have 1 instance of LinkableProject component per project
    if (LinkableProject.of(project))
      throw new Error(
        `Project ${project.name} already has associated LinkableProject component.`
      );

    super(project);
  }

  /**
   * Adds an implicit dependency between the dependant (this project) and dependency.
   *
   * @param dependency project to add the implicit dependency on.
   */
  public addImplicitDependency(...dependency: (Project | string)[]) {
    this.implicitDependencies.push(
      ...dependency.map((_d) => (typeof _d === "string" ? _d : _d.name))
    );
  }
}
