import * as child_process from "child_process";
import { Component } from "projen";
import { NodeProject } from "projen/lib/javascript";
import * as shell from "shelljs";
import "shelljs-plugin-authors";
import { Entity } from "./organisational";
import { DeepRequired } from "../util/deep-required";
import { Dynamic, resolve } from "../util/dynamic";
/**
 * Contributors options
 */
export type ContributorsOptions = {
  contributors?: boolean;
  autoPopulateFromGit?: boolean;
  additionalContributors?: (string | Entity)[];
};
/**
 * The `Contributors` component adds contributor information to the project
 */
export class Contributors extends Component {
  static defaultOptions: DeepRequired<ContributorsOptions> = {
    contributors: true,
    autoPopulateFromGit: true,
    additionalContributors: [],
  };
  contributors: Set<string | Entity>;
  options: DeepRequired<ContributorsOptions>;
  nodeProject: NodeProject;
  //options: ContributorsOptions;
  /**
   * creates the contributors component
   *
   * @param project the project to add to
   * @param options options
   */
  constructor(
    project: NodeProject,
    options?: Dynamic<ContributorsOptions, NodeProject>
  ) {
    super(project);
    this.nodeProject = project;
    this.options = resolve(project, options, Contributors.defaultOptions);
    this.contributors = new Set<string | Entity>();
    if (this.options.autoPopulateFromGit) {
      // If we don't have the full depth and cannot
      // get the full author list, so convert to full depth
      child_process.execSync(
        "if [ $(git rev-parse --is-shallow-repository) = true ];then git fetch --unshallow; fi"
      );
      const authors = (shell as any).default.authors();
      this.contributors = new Set<string | Entity>([
        ...this.options.additionalContributors,
        ...authors.stdout.split("\n"),
      ]);
      /* istanbul ignore next */
      if (process.env.CI === undefined || !process.env.CI) {
        this.contributors.add(
          `${child_process
            .execSync("git config user.name")
            .toString()
            .trim()} <${child_process
            .execSync("git config user.email")
            .toString()
            .trim()}>`
        );
      }
    } else {
      this.contributors = new Set<string | Entity>(
        this.options.additionalContributors
      );
    }
  }

  /**
   * adds the contributors to the package.json file.
   */
  preSynthesize(): void {
    if (this.options.contributors && this.contributors.size > 0) {
      this.nodeProject.package.addField("contributors", [...this.contributors]);
    }
  }

  /**
   * adds contributors to the project
   *
   * @param {...any} contributors the contributors to add
   */
  addContributors(...contributors: (string | Entity)[]): void {
    this.contributors = new Set([...this.contributors, ...contributors]);
  }
}
