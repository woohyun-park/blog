import { createDoc, createSummary, deleteFiles } from "../apis";

export function deleteDoc() {
  const summary = deleteFiles(process.argv[2]);
  createSummary(summary);
  createDoc(summary);
}

deleteDoc();
