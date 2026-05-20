import fs from "fs";
import path from "path";

const files = [
  "../src/pages/studentspage.jsx",
  "../src/components/section/sectionStudentsPanel.jsx",
];

const notifyImport =
  'import {\n  notify,\n} from "../lib/toast.js";\n';

const notifyImportSection =
  'import {\n  notify,\n} from "../../lib/toast.js";\n';

for (const relativePath of files) {
  const filePath = new URL(
    relativePath,
    import.meta.url
  );
  let source = fs.readFileSync(
    filePath,
    "utf8"
  );

  if (
    !source.includes(
      'from "../lib/toast.js"'
    ) &&
    !source.includes(
      'from "../../lib/toast.js"'
    )
  ) {
    const marker =
      relativePath.includes(
        "section"
      )
        ? 'from "../lib/api/studentapi.js";'
        : 'from "../lib/api/studentapi.js";';

    source = source.replace(
      marker,
      `${marker}\n\n${
        relativePath.includes(
          "section"
        )
          ? notifyImportSection
          : notifyImport
      }`
    );
  }

  source = source.replace(
    /\s*const \[\s*errorMessage,\s*setErrorMessage,\s*\] = useState\(""\);\s*\n/g,
    "\n"
  );

  source = source.replace(
    /setErrorMessage\(""\);\s*\n/g,
    ""
  );

  source = source.replace(
    /setErrorMessage\(\s*([\s\S]*?)\s*\);/g,
    (match, inner) => {
      if (
        !inner.includes("error")
      ) {
        return match;
      }

      const fallback =
        inner.match(
          /"([^"]+)"\s*$/
        )?.[1];

      return fallback
        ? `notify.error(error, "${fallback}");`
        : "notify.error(error);";
    }
  );

  source = source.replace(
    /\s*\{\s*errorMessage && \([\s\S]*?\)\s*\}\s*\n/g,
    "\n"
  );

  source = source.replace(
    /console\.log\(error\);/g,
    "notify.error(error, \"Photo could not be uploaded\");"
  );

  source = source.replace(
    /console\.log\(refreshError\);/g,
    ""
  );

  fs.writeFileSync(
    filePath,
    source
  );

  console.log(
    "migrated",
    path.basename(filePath)
  );
}
