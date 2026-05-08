// Lawyer data types

/**
 * Contact information for a lawyer
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  telegram?: string;
}

/**
 * Lawyer search result from search page
 * Contains basic information about a lawyer
 */
export interface LawyerSearchResult {
  /** Full name of the lawyer */
  name: string;
  /** City where the lawyer practices */
  city: string;
  /** Primary specialization */
  specialization: string;
  /** URL to the lawyer's profile on Harant portal */
  profileUrl: string;
  /** Rating (if available) */
  rating?: number;
}

/**
 * Complete lawyer profile with detailed information
 * Validates: Requirements 2.2
 */
export interface LawyerProfile {
  /** Full name of the lawyer */
  name: string;
  /** City where the lawyer practices */
  city: string;
  /** List of specializations */
  specialization: string[];
  /** Work experience (text description) */
  experience: string;
  /** Contact information */
  contacts: ContactInfo;
  /** Rating (if available) */
  rating?: number;
  /** Profile description */
  description?: string;
  /** Education background */
  education?: string[];
  /** Languages spoken */
  languages?: string[];
  /** Professional achievements */
  achievements?: string[];
}
