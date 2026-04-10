import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || /^https?:\/\/.+/i.test(value), {
    message: "Enter a valid URL",
  });

const tagArray = z.array(z.string().min(1));

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  rollNumber: z.string().min(3, "Roll number is required"),
  department: z.enum(["CSE", "IT", "ECE", "MECH", "CIVIL", "MBA"]),
  yearOfStudy: z.enum(["1st", "2nd", "3rd", "4th"]),
  expectedGraduation: z.string().min(3, "Expected graduation is required"),
  dateOfBirth: z.string().min(3, "Date of birth is required"),
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
  profilePhotoUrl: optionalUrl,
});

export const academicDetailsSchema = z.object({
  cgpa: z.number().min(0).max(10),
  tenthPercentage: z.number().min(0).max(100),
  twelfthPercentage: z.number().min(0).max(100),
  activeBacklogs: z.number().min(0).max(25),
  historicalBacklogs: z.number().min(0).max(50),
  specialization: z.string().min(2, "Specialization is required"),
  collegeName: z.string().min(2),
  university: z.string().min(2),
});

export const resumeChecklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  completed: z.boolean(),
});

export const resumeSchema = z.object({
  resumeLink: optionalUrl,
  atsScore: z.number().min(0).max(100),
  lastUpdated: z.string().min(3),
  checklist: z.array(resumeChecklistItemSchema),
});

export const publicProfileLinkSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(2),
  icon: z.string().min(1),
  tone: z.enum(["sky", "slate", "amber", "emerald", "violet"]),
  url: optionalUrl,
  visibility: z.enum(["public", "private"]),
  verified: z.boolean(),
});

export const contestRatingSchema = z.object({
  id: z.string().min(1),
  platform: z.enum([
    "LeetCode",
    "Codeforces",
    "CodeChef",
    "HackerRank",
    "AtCoder",
  ]),
  rating: z.number().min(0).max(5000),
  rank: z.string().optional(),
  percentile: z.number().min(0).max(100).optional(),
  contestName: z.string().optional(),
  date: z.string().min(3),
});

export const certificateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Certificate name is required"),
  organization: z.string().min(2, "Organization is required"),
  issueDate: z.string().min(3, "Issue date is required"),
  expiryDate: z.string().optional(),
  noExpiry: z.boolean().optional(),
  credentialId: z.string().optional(),
  url: optionalUrl.optional(),
  category: z.enum([
    "Cloud",
    "DSA",
    "Web Dev",
    "AI/ML",
    "Database",
    "Soft Skills",
    "Other",
  ]),
  relevance: z.enum(["relevant", "suggested"]),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, "Project title is required"),
  description: z.string().min(20, "Add at least 20 characters").max(200),
  techStack: z.array(z.string().min(1)).min(1, "Add at least one technology"),
  demoUrl: optionalUrl.optional(),
  githubUrl: optionalUrl.optional(),
  type: z.enum(["Academic", "Personal", "Open Source", "Freelance", "Internship"]),
  startDate: z.string().min(3),
  endDate: z.string().optional(),
  ongoing: z.boolean().optional(),
  teamSize: z.number().min(1).max(25),
  achievement: z.string().optional(),
});

export const experienceSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(2),
  role: z.string().min(2),
  employmentType: z.enum(["Internship", "Part-time", "Full-time", "Contract"]),
  startDate: z.string().min(3),
  endDate: z.string().optional(),
  present: z.boolean().optional(),
  location: z.string().min(2),
  remote: z.boolean(),
  description: z.string().min(20),
  stipend: z.number().min(0).optional(),
  offerLetterUrl: optionalUrl.optional(),
  skillsUsed: z.array(z.string().min(1)),
});

export const technicalSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  selfRating: z.number().min(1).max(5),
  aiRating: z.number().min(0).max(5),
});

export const softSkillSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(2),
  level: z.enum(["yes", "developing", "no"]),
});

export const jobPreferencesSchema = z.object({
  targetRoles: z.array(z.string().min(1)).min(1, "Select at least one role"),
  preferredDomains: z.array(z.string().min(1)).min(1, "Select at least one domain"),
  preferredLocations: z.array(z.string().min(1)).min(1, "Select at least one location"),
  ctcRange: z.tuple([z.number().min(3).max(50), z.number().min(3).max(50)]),
  openToRelocation: z.boolean(),
  noticePeriod: z.enum(["Immediate", "15 days", "30 days", "60 days"]),
  workModePreference: z.enum(["In-Office", "Hybrid", "Remote", "No Preference"]),
  aiMatchScore: z.number().min(0).max(100),
});

export const additionalDetailsSchema = z.object({
  fatherName: z.string().min(2),
  motherName: z.string().min(2),
  parentContactNumber: z.string().min(10),
  permanentAddress: z.string().min(10),
  category: z.enum(["General", "OBC", "SC", "ST", "EWS"]),
  differentlyAbled: z.boolean(),
  differentlyAbledDetails: z.string().optional(),
  passportAvailable: z.boolean(),
  languages: tagArray,
  hobbies: tagArray,
});

export const profileBuilderSchema = z.object({
  basic: basicInfoSchema,
  academic: academicDetailsSchema,
  resume: resumeSchema,
  links: z.array(publicProfileLinkSchema),
  contests: z.array(contestRatingSchema),
  certifications: z.array(certificateSchema),
  projects: z.array(projectSchema),
  experience: z.array(experienceSchema),
  skills: z.object({
    technical: z.array(technicalSkillSchema),
    soft: z.array(softSkillSchema),
  }),
  preferences: jobPreferencesSchema,
  additional: additionalDetailsSchema,
});

export type ProfileBuilderSchema = z.infer<typeof profileBuilderSchema>;
