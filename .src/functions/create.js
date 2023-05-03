import { createDoc, createFiles, createSummary } from "../apis/file";

function create() {
  const summary = createFiles(process.argv[2]);
  createSummary(summary);
  createDoc(summary);
}

create();
