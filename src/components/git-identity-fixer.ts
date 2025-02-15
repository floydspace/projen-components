import { Component, github, javascript } from "projen";
import type { GitIdentity } from "projen/lib/github/task-workflow.js";

/**
 * Options for fixing Git identity.
 */
export type GitIdentityFixerOptions = GitIdentity;

/**
 * The `GitIdentityFixer` class is a component that ensures the git identity is set
 * correctly for the release workflow. This helps in keeping the bot's commits consistent.
 */
export class GitIdentityFixer extends Component {
  /**
   * Constructor for the GitIdentityFixer class.
   *
   * @param project - The project instance.
   * @param options - Options for fixing Git identity.
   */
  constructor(
    project: javascript.NodeProject,
    private options: GitIdentityFixerOptions
  ) {
    super(project);
  }

  /**
   * Pre-synthesize hook for the GitIdentityFixer component.
   */
  preSynthesize(): void {
    super.preSynthesize();

    for (const workflow of this.project.root.node.children) {
      if (workflow instanceof github.GithubWorkflow) {
        // @ts-ignore - `jobs` is private
        for (const job of Object.values(workflow.jobs) as any[]) {
          if (Array.isArray(job.steps)) {
            const jobStep = job.steps.find(
              (s: any) => s.name === "Set git identity"
            );
            if (jobStep) {
              jobStep.run = github.WorkflowSteps.setupGitIdentity({
                gitIdentity: this.options,
              }).run;
            }
          }
        }
      }
    }
  }
}
