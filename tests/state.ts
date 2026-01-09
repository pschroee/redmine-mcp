export const state: {
  projectId: string;
  projectNumericId: number;
  secondProjectId: string | undefined;
  subprojectId: string | undefined;
  issueId: number;
  secondIssueId: number | undefined;
  childIssueId: number | undefined;
  privateIssueId: number | undefined;
  versionId: number;
  secondVersionId: number | undefined;
  categoryId: number;
  secondCategoryId: number | undefined;
  relationId: number;
  attachmentId: number;
  uploadToken: string;
  wikiPageName: string;
  childWikiPageName: string;
  adminUserId: number;
  trackerId: number;
  secondTrackerId: number;
  statusOpenId: number;
  statusClosedId: number;
  priorityId: number;
} = {
  // Project IDs
  projectId: "",
  projectNumericId: 0,
  secondProjectId: undefined,
  subprojectId: undefined,

  // Issue IDs
  issueId: 0,
  secondIssueId: undefined,
  childIssueId: undefined,
  privateIssueId: undefined,

  // Other IDs
  versionId: 0,
  secondVersionId: undefined,
  categoryId: 0,
  secondCategoryId: undefined,
  relationId: 0,
  attachmentId: 0,
  uploadToken: "",
  wikiPageName: "",
  childWikiPageName: "",

  // Metadata from Redmine
  adminUserId: 0,
  trackerId: 0,
  secondTrackerId: 0,
  statusOpenId: 0,
  statusClosedId: 0,
  priorityId: 0,
};
