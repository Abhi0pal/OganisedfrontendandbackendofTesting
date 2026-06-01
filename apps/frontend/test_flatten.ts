function flattenFormData(formData: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        visit(value);
        continue;
      }
      flat[key] = value;
    }
  };

  visit(formData);
  return flat;
}
console.log(flattenFormData({ "my_file": { "filePath": "/foo" }, "my_group": { "field1": "val1" } }));
