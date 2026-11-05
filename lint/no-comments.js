const plugin = {
  meta: { name: "local" },
  rules: {
    "no-comments": {
      meta: {
        type: "problem",
        docs: { description: "Disallow comments." },
      },
      create(context) {
        return {
          Program(node) {
            for (const comment of node.comments) {
              if (comment.type === "Shebang") continue;
              context.report({
                node: comment,
                message: "Remove this comment.",
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
