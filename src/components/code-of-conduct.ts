import * as fs from "fs-extra";
import { FileBase, FileBaseOptions, Project } from "projen";
import { CSpell } from "./cspell";

/**
 * options for CodeOfConduct
 */
export interface CodeOfConductOptions extends FileBaseOptions {
  /**
   * You must provide a contact method so that people know how to report violations.
   */
  readonly contactMethod: string;
}

/**
 * adds codeOfConduct to the project, which manages the CODE_OF_CONDUCT.md file
 */
export class CodeOfConduct extends FileBase {
  text: string;

  /**
   * adds codeOfConduct to the project
   *
   * @param project the project to add to
   * @param options - see `CodeOfConductOptions`
   */
  constructor(project: Project, options: CodeOfConductOptions) {
    super(project, "CODE_OF_CONDUCT.md", options);
    const textFile = `${__dirname}/../../code-of-conduct-text/contributor-covenant-2.1.md`;
    // if (!fs.existsSync(textFile)) {
    //   throw new Error(`unsupported code of conduct contributor-covenant-2.1`);
    // }
    let text = fs.readFileSync(textFile, "utf8");
    text = text.replace("[INSERT CONTACT METHOD]", options.contactMethod);
    this.text = text;
  }

  /**
   * Called before synthesis.
   */
  preSynthesize(): void {
    for (const component of this.project.components) {
      if (component instanceof CSpell) {
        component.options.cSpellOptions.overrides = [
          ...(component.options.cSpellOptions.overrides || []),
          {
            language: "en",
            filename: "CODE_OF_CONDUCT.md",
            words: ["socio-economic"],
          },
        ];
      }
    }
  }
  /**
   * Returns the contents of the file to emit.
   *
   * @returns the content to synthesize or undefined to skip the file
   */
  protected synthesizeContent(): string | undefined {
    return this.text;
  }
}
