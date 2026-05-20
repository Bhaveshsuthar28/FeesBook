import fs from "fs";

const path =
  new URL(
    "../src/pages/settingspages.jsx",
    import.meta.url
  );

let source =
  fs.readFileSync(
    path,
    "utf8"
  );

source =
  source.replace(
    /\s*\{error && \([\s\S]*?\)\}\s*\n\s*\{message && \([\s\S]*?\)\}\s*\n/,
    "\n"
  );

source =
  source.replace(
    /\s*\{\s*structureError && \([\s\S]*?\)\s*\}\s*\n/,
    "\n"
  );

source =
  source.replace(
    /setError\(""\);\s*\n/g,
    ""
  );

source =
  source.replace(
    /setMessage\(\s*"([^"]+)"\s*\);/g,
    'notify.success("$1");'
  );

source =
  source.replace(
    /setError\(\s*"([^"]+)"\s*\);/g,
    'notify.error(null, "$1");'
  );

source =
  source.replace(
    /setError\(\s*([\s\S]*?)\s*\);/g,
    (match, inner) => {
      if (
        !inner.includes(
          "apiError"
        )
      ) {
        return match;
      }

      const fallback =
        inner.match(
          /"([^"]+)"\s*$/
        )?.[1];

      return fallback
        ? `notify.error(apiError, "${fallback}");`
        : "notify.error(apiError);";
    }
  );

fs.writeFileSync(
  path,
  source
);

console.log(
  "settingspages toast migration done"
);
