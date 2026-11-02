/* @ds-bundle: {"format":4,"namespace":"Forgeron","components":[{"name":"Button"},{"name":"Badge"},{"name":"EnvTag"},{"name":"Input"},{"name":"CodeBlock"},{"name":"ToolCard"},{"name":"DeploymentList"},{"name":"PermissionTable"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function omit(o, keys) { var r = {}; for (var k in o) if (keys.indexOf(k) < 0) r[k] = o[k]; return r; }

  function Button(p) {
    var variant = p.variant || "secondary", size = p.size || "md";
    var rest = omit(p, ["variant", "size", "kbd", "className", "children"]);
    return h("button", Object.assign({ type: "button" }, rest, {
      className: cx("fg-btn", "fg-btn-" + variant, size !== "md" && "fg-btn-" + size, p.className)
    }), p.children, p.kbd ? h("span", { className: "fg-btn-kbd", "aria-hidden": "true" }, p.kbd) : null);
  }

  function Badge(p) {
    var tone = p.tone || "neutral";
    return h("span", { className: cx("fg-badge", tone !== "neutral" && "fg-badge-" + tone, p.mono && "fg-badge-mono", p.className) },
      p.dot ? h("span", { className: "fg-dot", "aria-hidden": "true" }) : null, p.children);
  }

  var ENV_LABEL = { production: "Production", pilot: "Pilote", preview: "Preview" };
  function EnvTag(p) {
    var env = p.env || "preview";
    return h("span", { className: cx("fg-env", "fg-env-" + env, p.className) },
      h("span", { className: "fg-env-mark", "aria-hidden": "true" }), p.children || ENV_LABEL[env]);
  }

  var uid = 0;
  function Input(p) {
    var idRef = React.useRef(null);
    if (!idRef.current) idRef.current = p.id || "fg-input-" + (++uid);
    var id = idRef.current;
    var rest = omit(p, ["label", "hint", "error", "mono", "className", "id"]);
    var describedBy = p.error ? id + "-err" : p.hint ? id + "-hint" : undefined;
    return h("div", { className: cx("fg-field", p.className) },
      p.label ? h("label", { className: "fg-label", htmlFor: id }, p.label) : null,
      h("input", Object.assign({}, rest, { id: id, className: cx("fg-input", p.mono && "fg-input-mono"),
        "aria-invalid": p.error ? "true" : undefined, "aria-describedby": describedBy })),
      p.error ? h("span", { className: "fg-error", id: id + "-err" }, p.error)
        : p.hint ? h("span", { className: "fg-hint", id: id + "-hint" }, p.hint) : null);
  }

  function CodeBlock(p) {
    var st = React.useState(false), copied = st[0], setCopied = st[1];
    var lines = String(p.code || "").split("\n");
    function copy() {
      try {
        var plain = lines.map(function (l) { return l.replace(/^\$ /, ""); }).join("\n");
        navigator.clipboard.writeText(plain).then(function () { setCopied(true); setTimeout(function () { setCopied(false); }, 1500); }, function () {});
      } catch (e) {}
    }
    return h("div", { className: cx("fg-code", p.className) },
      h("div", { className: "fg-code-head" },
        h("span", null, p.title || p.lang || "terminal"),
        h("button", { type: "button", className: "fg-code-copy", onClick: copy }, copied ? "Copié" : "Copier")),
      h("pre", null, lines.map(function (l, i) {
        var node;
        if (/^\$ /.test(l)) node = [h("span", { className: "fg-prompt", key: "p" }, "$ "), l.slice(2)];
        else if (/^\s*(#|\/\/)/.test(l)) node = h("span", { className: "fg-comment" }, l);
        else node = l;
        return h(React.Fragment, { key: i }, node, i < lines.length - 1 ? "\n" : null);
      })));
  }

  var IFACE = { mcp: "MCP", api: "API", web: "Web", cli: "CLI" };
  function ToolCard(p) {
    return h("article", { className: cx("fg-card", p.className) },
      h("div", { className: "fg-card-head" },
        h("div", null,
          h("h3", { className: "fg-card-title" }, p.name),
          p.version ? h("span", { className: "fg-card-version" }, p.version) : null),
        p.env ? h(EnvTag, { env: p.env }) : null),
      p.description ? h("p", { className: "fg-card-desc" }, p.description) : null,
      h("div", { className: "fg-card-foot" },
        h("div", { className: "fg-card-ifaces", "aria-label": "Interfaces" },
          (p.interfaces || []).map(function (i) { return h(Badge, { key: i, mono: true }, IFACE[i] || i); })),
        p.meta ? h("span", { className: "fg-card-meta" }, p.meta) : null));
  }

  var STATUS = {
    live: { tone: "success", label: "En ligne" },
    building: { tone: "warning", label: "Build en cours" },
    failed: { tone: "danger", label: "Échec" },
    superseded: { tone: "neutral", label: "Remplacée" }
  };
  function DeploymentList(p) {
    return h("div", { className: cx("fg-deploys", p.className), role: "list" },
      (p.items || []).map(function (d, i) {
        var s = STATUS[d.status] || STATUS.superseded;
        return h("div", { className: "fg-deploy", role: "listitem", key: d.version + "-" + i },
          h("span", { className: "fg-deploy-version" }, d.version),
          h("span", { className: "fg-deploy-msg" },
            h("span", { className: "fg-deploy-title" }, d.message),
            h("span", { className: "fg-deploy-sub" }, h("code", null, d.commit), " · ", d.author, " · ", d.time)),
          d.env ? h(EnvTag, { env: d.env }) : h("span"),
          h(Badge, { tone: s.tone, dot: true }, s.label));
      }));
  }

  function PermissionTable(p) {
    var roles = p.roles || [], actions = p.actions || [];
    var st = React.useState(p.grants || {}), grants = st[0], setGrants = st[1];
    function toggle(a, r) {
      var next = Object.assign({}, grants); next[a] = Object.assign({}, next[a]); next[a][r] = !next[a][r];
      setGrants(next); if (p.onChange) p.onChange(next);
    }
    return h("table", { className: cx("fg-perm", p.className) },
      h("thead", null, h("tr", null, h("th", { scope: "col" }, "Action"),
        roles.map(function (r) { return h("th", { scope: "col", key: r.id }, r.label); }))),
      h("tbody", null, actions.map(function (a) {
        return h("tr", { key: a.name },
          h("th", { scope: "row" }, h("span", { className: "fg-perm-action" }, a.name), a.kind ? h("span", { className: "fg-perm-kind" }, a.kind) : null),
          roles.map(function (r) {
            var on = !!(grants[a.name] && grants[a.name][r.id]);
            return h("td", { key: r.id }, h("input", { type: "checkbox", className: "fg-check", checked: on, disabled: !!r.locked,
              "aria-label": a.name + " pour " + r.label, onChange: function () { toggle(a.name, r.id); } }));
          }));
      })));
  }

  window.Forgeron = Object.assign(window.Forgeron || {}, {
    Button: Button, Badge: Badge, EnvTag: EnvTag, Input: Input, CodeBlock: CodeBlock,
    ToolCard: ToolCard, DeploymentList: DeploymentList, PermissionTable: PermissionTable
  });
})();
