import { TypeScriptProject } from "projen/lib/typescript";
import { Vitest } from "../../src";
import { synthSnapshot, mkdtemp } from "../util/util";

test("vitest is added", () => {
  const project = new TypeScriptProject({
    outdir: mkdtemp(),
    name: "test-project",
    defaultReleaseBranch: "main",
    jest: false,
  });

  new TypeScriptProject({
    parent: project,
    outdir: "packages/test-subproject",
    name: "test-subproject",
    defaultReleaseBranch: "main",
    jest: false,
  });

  new Vitest(project);
  const snapshot = synthSnapshot(project);

  const packageJson = snapshot["package.json"];
  const subprojectPackageJson =
    snapshot["packages/test-subproject/package.json"];
  expect(packageJson.devDependencies).toHaveProperty("vitest");
  expect(packageJson.devDependencies).toHaveProperty("@vitest/coverage-v8");
  expect(packageJson.devDependencies).not.toHaveProperty("jest");
  expect(packageJson.devDependencies).not.toHaveProperty("jest-junit");
  expect(packageJson.devDependencies).not.toHaveProperty("@types/jest");
  expect(packageJson.devDependencies).not.toHaveProperty("ts-jest");
  expect(subprojectPackageJson.devDependencies).toHaveProperty("vitest");
  expect(subprojectPackageJson.devDependencies).not.toHaveProperty("jest");
  expect(Object.keys(snapshot)).toContain("vitest.workspace.json");
});

test("vitest is not added if jest is already configured", () => {
  const project = new TypeScriptProject({
    outdir: mkdtemp(),
    name: "test-project",
    defaultReleaseBranch: "main",
  });

  new TypeScriptProject({
    parent: project,
    outdir: "packages/test-subproject",
    name: "test-subproject",
    defaultReleaseBranch: "main",
    jestOptions: {
      configFilePath: "jest.config.json",
    },
  });

  expect(() => new Vitest(project)).toThrowError(
    "Cannot add the Vitest component to a project that already has a 'jest' configuration."
  );
});
