-- Ensure upserts work reliably by adding the expected unique indexes

CREATE UNIQUE INDEX IF NOT EXISTS code_analysis_user_id_file_path_key
ON public.code_analysis (user_id, file_path);

CREATE UNIQUE INDEX IF NOT EXISTS projects_user_id_name_key
ON public.projects (user_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS code_knowledge_user_id_file_id_concept_name_key
ON public.code_knowledge (user_id, file_id, concept_name);
