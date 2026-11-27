-- Let learners keep archives and common data files in their private folder (used by the GRC "Unpack archives" tool).
-- Raises the per-file limit to 50 MB (the Supabase free-plan maximum) and adds archive, data and text types.
-- Executables and scripts stay blocked.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'application/pdf','image/png','image/jpeg','image/webp','image/gif','text/plain','text/markdown','text/csv',
      'application/json','application/xml','text/xml','application/rtf',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.text','application/vnd.oasis.opendocument.spreadsheet','application/vnd.oasis.opendocument.presentation',
      'application/zip','application/x-7z-compressed','application/vnd.rar','application/x-tar','application/gzip','application/x-bzip2','application/x-xz'
    ]
where id = 'learner-files';
