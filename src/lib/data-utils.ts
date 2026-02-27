/**
 * Converts an array of objects (JSON) into a CSV string
 * Handles nested objects by converting them into JSON strings
 */
export const convertToCSV = (objArray: any[]) => {
  if (!objArray || objArray.length === 0) return "";

  // 1. Extract all possible headers
  const headers = Array.from(
    new Set(objArray.flatMap((doc) => Object.keys(doc))),
  );

  const csvRows = [];

  // 2. Add the header line
  csvRows.push(headers.join(","));

  // 3. Add data
  for (const row of objArray) {
    const values = headers.map((header) => {
      let val = row[header];

      // If it is an object (e.g. a Date or a subdocument), we stringify it.
      if (val !== null && typeof val === "object") {
        val = JSON.stringify(val);
      }

      // We escape the quotation marks and surround them with quotation marks to handle commas
      const escaped = ("" + (val ?? "")).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
};
