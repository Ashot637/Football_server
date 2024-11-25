import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type CreateTemplateBodyParam = FromSchema<typeof schemas.CreateTemplate.body>;
export type CreateTemplateResponse200 = FromSchema<typeof schemas.CreateTemplate.response['200']>;
export type CreateVerificationBodyParam = FromSchema<typeof schemas.CreateVerification.body>;
export type CreateVerificationResponse201 = FromSchema<typeof schemas.CreateVerification.response['201']>;
export type DeleteTemplateMetadataParam = FromSchema<typeof schemas.DeleteTemplate.metadata>;
export type GetTemplateMetadataParam = FromSchema<typeof schemas.GetTemplate.metadata>;
export type GetTemplateResponse200 = FromSchema<typeof schemas.GetTemplate.response['200']>;
export type GetTemplatesMetadataParam = FromSchema<typeof schemas.GetTemplates.metadata>;
export type GetTemplatesResponse200 = FromSchema<typeof schemas.GetTemplates.response['200']>;
export type GetVerificationsMetadataParam = FromSchema<typeof schemas.GetVerifications.metadata>;
export type GetVerificationsResponse200 = FromSchema<typeof schemas.GetVerifications.response['200']>;
export type UpdateTemplateBodyParam = FromSchema<typeof schemas.UpdateTemplate.body>;
export type UpdateTemplateMetadataParam = FromSchema<typeof schemas.UpdateTemplate.metadata>;
export type UpdateTemplateResponse200 = FromSchema<typeof schemas.UpdateTemplate.response['200']>;
