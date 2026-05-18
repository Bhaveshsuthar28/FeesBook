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
  "11th-Arts",
  "11th-SM",
  "11th-SB",
  "11th-Commerce",
  "12th-Arts",
  "12th-SM",
  "12th-SB",
  "12th-Commerce",
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
