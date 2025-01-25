import { Component, Project } from "projen";

/**
 * Utility for projen projects
 */
export namespace ProjectUtils {
  /**
   * List all parent class names of the given class (includes the given class's name as the last element)
   *
   * @internal
   * @returns {string[]} An array of parent class names.
   */
  function listParentClassNames(clazz?: {
    new (...args: any[]): any;
  }): string[] {
    if (!clazz?.name) {
      return [];
    }
    return [...listParentClassNames(Object.getPrototypeOf(clazz)), clazz.name];
  }

  /**
   * Returns whether the given project is an instance of the given project class.
   * Uses the class name to perform this check, such that the check still passes for
   * classes imported from mismatching package versions.
   *
   * @param instance The project instance to check.
   * @param clazz The class to check against.
   * @returns {boolean} True if the instance is an instance of the given class, false otherwise.
   */
  export function isNamedInstanceOf<
    TParent extends Project | Component,
    TChild extends TParent
  >(
    instance: TParent,
    clazz: { new (...args: any[]): TChild }
  ): instance is TChild {
    return new Set(listParentClassNames(instance.constructor as any)).has(
      clazz.name
    );
  }
}
