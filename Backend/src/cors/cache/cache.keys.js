/**
 * Cache key builder functions.
 * All functions are pure and do not perform any database queries.
 */
export const keys = {
  /**
   * Generates cache key for a school's profile.
   * @param {string|number} schoolId - The school ID.
   * @returns {string} Redis cache key.
   */
  schoolProfile(schoolId) {
    return `school:${schoolId}:profile`;
  },

  /**
   * Generates cache key for a school's academic year configuration.
   * @param {string|number} schoolId - The school ID.
   * @returns {string} Redis cache key.
   */
  academicYear(schoolId) {
    return `school:${schoolId}:academic_year`;
  },

  /**
   * Generates cache key for a school's dashboard page.
   * @param {string|number} schoolId - The school ID.
   * @param {string|number} year - The academic year.
   * @returns {string} Redis cache key.
   */
  dashboard(schoolId, year) {
    return `school:${schoolId}:dashboard:${year}`;
  },

  /**
   * Generates cache key for a school's dashboard insights.
   * @param {string|number} schoolId - The school ID.
   * @param {string|number} year - The academic year.
   * @returns {string} Redis cache key.
   */
  dashboardInsights(schoolId, year) {
    return `school:${schoolId}:insights:${year}`;
  },

  /**
   * Generates cache key for a school's fee types.
   * @param {string|number} schoolId - The school ID.
   * @returns {string} Redis cache key.
   */
  feeTypes(schoolId) {
    return `school:${schoolId}:fee_types`;
  },

  /**
   * Generates cache key for a class's fees list.
   * @param {string|number} classId - The class ID.
   * @returns {string} Redis cache key.
   */
  classFees(classId) {
    return `class:${classId}:fees`;
  },

  /**
   * Generates cache key for a section's students list, paginated.
   * @param {string|number} sectionId - The section ID.
   * @param {string|number} page - The page number.
   * @returns {string} Redis cache key.
   */
  sectionStudents(sectionId, page) {
    return `section:${sectionId}:students:${page}`;
  }
};

/**
 * Cache TTL (Time-To-Live) constants in seconds.
 */
export const TTL = {
  PROFILE: 300,        // 5 minutes
  ACADEMIC_YEAR: 600,  // 10 minutes
  DASHBOARD: 60,       // 1 minute
  FEE_TYPES: 600,      // 10 minutes
  CLASS_FEES: 300,     // 5 minutes
  STUDENTS: 30         // 30 seconds
};
