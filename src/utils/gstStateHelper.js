export const STATE_CODES = {
  "01": { name: "Jammu and Kashmir", code: 1 },
  "02": { name: "Himachal Pradesh", code: 2 },
  "03": { name: "Punjab", code: 3 },
  "04": { name: "Chandigarh", code: 4 },
  "05": { name: "Uttarakhand", code: 5 },
  "06": { name: "Haryana", code: 6 },
  "07": { name: "Delhi", code: 7 },
  "08": { name: "Rajasthan", code: 8 },
  "09": { name: "Uttar Pradesh", code: 9 },
  "10": { name: "Bihar", code: 10 },
  "11": { name: "Sikkim", code: 11 },
  "12": { name: "Arunachal Pradesh", code: 12 },
  "13": { name: "Nagaland", code: 13 },
  "14": { name: "Manipur", code: 14 },
  "15": { name: "Mizoram", code: 15 },
  "16": { name: "Tripura", code: 16 },
  "17": { name: "Meghalaya", code: 17 },
  "18": { name: "Assam", code: 18 },
  "19": { name: "West Bengal", code: 19 },
  "20": { name: "Jharkhand", code: 20 },
  "21": { name: "Odisha", code: 21 },
  "22": { name: "Chhattisgarh", code: 22 },
  "23": { name: "Madhya Pradesh", code: 23 },
  "24": { name: "Gujarat", code: 24 },
  "25": { name: "Daman and Diu", code: 25 },
  "26": { name: "Dadra and Nagar Haveli", code: 26 },
  "27": { name: "Maharashtra", code: 27 },
  "28": { name: "Andhra Pradesh (Before division)", code: 28 },
  "29": { name: "Karnataka", code: 29 },
  "30": { name: "Goa", code: 30 },
  "31": { name: "Lakshadweep", code: 31 },
  "32": { name: "Kerala", code: 32 },
  "33": { name: "Tamil Nadu", code: 33 },
  "34": { name: "Puducherry", code: 34 },
  "35": { name: "Andaman and Nicobar Islands", code: 35 },
  "36": { name: "Telangana", code: 36 },
  "37": { name: "Andhra Pradesh", code: 37 },
  "38": { name: "Ladakh", code: 38 }
};

/**
 * Flat array of all Indian states/UTs with name, code, and padded key.
 * Useful for dropdowns, autocomplete, and search.
 */
export const INDIAN_STATES = Object.entries(STATE_CODES).map(([key, val]) => ({
  key,
  name: val.name,
  code: val.code,
}));

/**
 * Parses state details from GSTIN.
 * Returns { name: string, code: number } or null.
 */
export function getStateFromGstin(gstin) {
  if (!gstin || gstin.length < 2) return null;
  const stateCodePrefix = gstin.substring(0, 2);
  return STATE_CODES[stateCodePrefix] || null;
}

/**
 * Validates GSTIN pattern.
 * Indian GSTIN has 15 characters: 2 digits (state code), 10 alphanumeric (PAN), 1 digit/char, 1 char, 1 digit/char.
 */
export function validateGstin(gstin) {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.toUpperCase());
}
