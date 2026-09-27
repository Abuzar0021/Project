export const ACCEPTED = ".txt,.md,.docx";

/** Read a file's text in the browser. Nothing is uploaded anywhere. */
export async function readWriting(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) return file.text();
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return value;
  }
  throw new Error("Margin reads .txt, .md and .docx files.");
}
