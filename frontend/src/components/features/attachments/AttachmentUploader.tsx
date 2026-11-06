import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useUploadAttachment } from "@/hooks/attachments/useAttachments";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  type AttachmentTarget,
} from "@/interface/attachment/attachment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// Checks the type and size first for a quick message; the server checks the
// file's real content again.
const AttachmentUploader = ({ target }: { target: AttachmentTarget }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>();
  const { upload, isPending } = useUploadAttachment();

  const choose = (chosen?: File) => {
    setError(undefined);
    setFile(undefined);

    if (!chosen) return;

    if (!ALLOWED_ATTACHMENT_TYPES.includes(chosen.type)) {
      setError("Only JPEG, PNG, WebP and PDF files are allowed.");
    } else if (chosen.size > MAX_ATTACHMENT_BYTES) {
      setError("The file is larger than 20 MB.");
    } else {
      setFile(chosen);
    }
  };

  const reset = () => {
    setFile(undefined);
    setDescription("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (!file) return;
    upload({ target, file, description: description.trim() || undefined })
      .then(reset)
      .catch(() => {});
  };

  const fileInputId = `attachment-file-${target.kind}-${target.id}`;
  const descriptionId = `attachment-description-${target.kind}-${target.id}`;

  return (
    <div className='space-y-3 rounded-md border border-dashed p-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1 space-y-1'>
          <label htmlFor={fileInputId} className='text-sm font-medium'>
            File
          </label>
          <Input
            ref={inputRef}
            id={fileInputId}
            type='file'
            accept={ATTACHMENT_ACCEPT}
            aria-invalid={!!error}
            aria-describedby={`${fileInputId}-hint`}
            onChange={(event) => choose(event.target.files?.[0])}
          />
        </div>
        <div className='flex-1 space-y-1'>
          <label htmlFor={descriptionId} className='text-sm font-medium'>
            Description{" "}
            <span className='text-muted-foreground'>(optional)</span>
          </label>
          <Input
            id={descriptionId}
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder='e.g. Point of origin, north wall'
          />
        </div>
        <Button onClick={submit} disabled={!file || isPending}>
          {isPending ? <Spinner /> : <Upload className='size-4' />}
          Upload
        </Button>
      </div>
      <p
        id={`${fileInputId}-hint`}
        className={
          error ? "text-sm text-destructive" : "text-xs text-muted-foreground"
        }
        role={error ? "alert" : undefined}
      >
        {error ?? "JPEG, PNG, WebP or PDF, up to 20 MB."}
      </p>
    </div>
  );
};

export default AttachmentUploader;
