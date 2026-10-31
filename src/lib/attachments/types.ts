export type Attachment = {
  id:string;original_name:string;mime_type:string;byte_size:number;sha256:string;created_at:string;
};
export type DraftAttachment = Attachment & {request_id?:string;storage_state:"pending"|"ready";removed_at:string|null;has_snapshots:boolean};
export type DraftAttachmentData = {
  draft:{id:string;title:string|null;attachment_revision:number};
  files:DraftAttachment[];archived:DraftAttachment[];archived_count:number;can_upload:boolean;
};
export type FileActionState = {error?:string;message?:string;nextRequestId?:string};
