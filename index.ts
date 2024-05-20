import * as csv from "fast-csv";
import fs from "fs";
import readline from "readline/promises";

const tagRegex =
  /<(?<tag>[\w-]*)(?:\s+[\w-]+(?:=(?<quote>"|')[^>]*\k<quote>)?)*>(?<value>.*)<\/\k<tag>>/;

function stripHtmlTags(text: string) {
  while (tagRegex.test(text)) {
    text = text.replace(tagRegex, "$<value>");
  }
  return text;
}

function stripAllHtmlTagInValues(object: Record<string, string>) {
  const newRecord: Record<string, string> = {};

  for (const [key, value] of Object.entries(object)) {
    newRecord[key] = stripHtmlTags(value);
  }

  return newRecord;
}

(async function () {
  const input = readline.createInterface(process.stdin, process.stdout);
  const file = await input.question("File location: ");
  const outputTo = await input.question("Save location: ");
  const writeStream = fs.createWriteStream(outputTo);

  fs.createReadStream(file)
    .pipe(csv.parse({ headers: true }))
    .pipe(csv.format({ headers: true }))
    .transform((row, next) => {
      return next(null, stripAllHtmlTagInValues(row as any));
    })
    .pipe(writeStream)
    .on("close", () => {
      console.log("File successfully written");
      process.exit();
    });
})();
