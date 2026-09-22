import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const required = (relative) => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    failures.push(`missing file: ${relative}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
};

const status = JSON.parse(required("course-status.json") || "{}");
const readme = required("README.md");
required("LEARNING_CONSTITUTION.md");
required("Gotchas.md");
required("SOURCES.md");

for (const id of status.completed || []) {
  const lessonPath = `${id}/readme.md`;
  const lesson = required(lessonPath);
  for (const marker of ["## 本轮目标", "## 本轮结论"]) {
    if (lesson && !lesson.includes(marker)) failures.push(`${lessonPath}: missing ${marker}`);
  }
  if (!readme.includes(`(${lessonPath})`)) failures.push(`README.md: missing link to ${lessonPath}`);
}

const exercises = ["01-minimal-composition", "02-time-window", "03-track-and-layer", "04-frame-seeking"];
for (const name of exercises) {
  const base = `00/exercises/${name}`;
  for (const artifact of ["README.md", "task.md", "prompt.md", "harness.md", "params.json", "solution/index.html", "audit.md"]) {
    required(`${base}/${artifact}`);
  }
}

const markdownFiles = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.name.endsWith(".md")) markdownFiles.push(absolute);
  }
};
visit(root);

for (const file of markdownFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (/^(https?:|#|mailto:)/.test(link)) continue;
    const target = path.resolve(path.dirname(file), link);
    if (!fs.existsSync(target)) failures.push(`${path.relative(root, file)}: broken link ${link}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Course structure OK: ${status.completed.length}/30 rounds complete; ${markdownFiles.length} markdown files checked.`);
