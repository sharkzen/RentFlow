export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.Node).forEach((path) => {
    const node = path.value;

    node.comments = null;
    node.leadingComments = null;
    node.trailingComments = null;
    node.innerComments = null;
  });

  root.find(j.JSXExpressionContainer).forEach((path) => {
    const expression = path.value.expression;

    if (expression.type === "JSXEmptyExpression") {
      if (!expression.innerComments && !expression.comments) {
        j(path).remove();
      }
    }
  });

  return root.toSource({
    quote: "double",
    reuseWhitespace: false,
  });
}
