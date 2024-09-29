import { Component, javascript } from "projen";

/**
 * adds only-allow to the project
 */
export class OnlyAllow extends Component {
  /**
   * adds only-allow to the project
   *
   * @param project the project to add to
   */
  constructor(project: javascript.NodeProject) {
    super(project);

    project.addDevDeps("only-allow");

    project.addTask("preinstall", {
      exec: `npx only-allow ${project.package.packageManager}`,
      description: "asserts the correct package manager is used",
    });
  }
}
