import { createDoc, createFiles, createSummary } from "../apis";

function create() {
  const summary = createFiles(process.argv[2]);
  createSummary(summary);
  createDoc(summary);
}

create();
