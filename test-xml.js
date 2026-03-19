const { XMLParser } = require("fast-xml-parser");

const xml = `<root><row itemId="123" itemName="apple" pricePL1="5" onHand="10" /></root>`;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});
const parsed = parser.parse(xml);
console.log(JSON.stringify(parsed, null, 2));
