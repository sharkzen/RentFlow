export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // 🔥 ลบ comment ปกติทั้งหมด
  root.find(j.Program).forEach((path) => {
    path.node.comments = null;
  });

  // 🔥 ลบ comment ที่ติดกับ node
  root.find(j.Node).forEach((path) => {
    path.node.leadingComments = null;
    path.node.trailingComments = null;
    path.node.innerComments = null;
  });

  // 🔥 ลบ JSX comment: {/* ... */}
  root.find(j.JSXExpressionContainer).forEach((path) => {
    const expr = path.node.expression;

    if (expr && expr.comments && expr.comments.length > 0) {
      // แทนด้วย newline กัน JSX ชิด
      j(path).replaceWith(j.jsxText("\n"));
    }
  });

  return root.toSource({
    quote: "double",
    reuseWhitespace: false,
  });
}
