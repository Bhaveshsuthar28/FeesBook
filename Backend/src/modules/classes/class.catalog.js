export const getAcademicYearForDate =
  (date = new Date()) => {
    const value =
      date instanceof Date
        ? date
        : new Date(date);
    const parts =
      new Intl.DateTimeFormat(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",
          year: "numeric",
          month: "numeric",
        }
      ).formatToParts(value);
    const year =
      Number(
        parts.find(
          (part) =>
            part.type === "year"
        )?.value
      );
    const month =
      Number(
        parts.find(
          (part) =>
            part.type === "month"
        )?.value
      );
    const startYear =
      month >= 5
        ? year
        : year - 1;

    return `${startYear}-${startYear + 1}`;
  };

export const getPreviousAcademicYear =
  (academicYear) => {
    const [startYear] =
      String(academicYear)
        .split("-");
    const previousStart =
      Number(startYear) - 1;

    return `${previousStart}-${previousStart + 1}`;
  };

export const getCurrentAcademicYear =
  () => getAcademicYearForDate();

export const CURRENT_ACADEMIC_YEAR =
  getCurrentAcademicYear();

export const classNames = [
  "LKG",
  "UKG",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th-PCM",
  "11th-PCB",
  "11th-PCMB",
  "11th-COM",
  "11th-ARTS",
  "11th-AGRI",
  "12th-PCM",
  "12th-PCB",
  "12th-PCMB",
  "12th-COM",
  "12th-ARTS",
  "12th-AGRI",
];

export const getClassCatalog =
  (academicYear = getCurrentAcademicYear()) =>
    classNames.map((name, index) => ({
      name,
      sequence: index + 1,
      academicYear,
    }));

export const CLASS_CATALOG =
  getClassCatalog();

export const getCatalogClassByName =
  (
    name,
    academicYear = getCurrentAcademicYear()
  ) =>
    getClassCatalog(academicYear).find(
      (item) =>
        item.name.toLowerCase() ===
        String(name).trim().toLowerCase()
    );

export const getClassLevel = (name) => {
  const normalized = String(name).trim().toLowerCase();
  if (normalized === "lkg") return 1;
  if (normalized === "ukg") return 2;
  if (normalized === "1st") return 3;
  if (normalized === "2nd") return 4;
  if (normalized === "3rd") return 5;
  if (normalized === "4th") return 6;
  if (normalized === "5th") return 7;
  if (normalized === "6th") return 8;
  if (normalized === "7th") return 9;
  if (normalized === "8th") return 10;
  if (normalized === "9th") return 11;
  if (normalized === "10th") return 12;
  if (normalized.startsWith("11th-")) return 13;
  if (normalized.startsWith("12th-")) return 14;
  return 0;
};

