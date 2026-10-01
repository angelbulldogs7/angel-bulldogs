export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      return nextResolve(specifier, context);
    }
  }
  return nextResolve(specifier, context);
}
