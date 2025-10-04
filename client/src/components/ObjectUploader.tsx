import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Uppy, { type UppyFile } from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: File) => Promise<{
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const uppyRef = useRef<Uppy | null>(null);

  useEffect(() => {
    const uppy = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
    }).use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters: async (uppyFile: UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
        try {
          const file = uppyFile.data as File;
          console.log('🔵 [Upload] Getting parameters for:', file.name);
          const params = await onGetUploadParameters(file);
          console.log('🟢 [Upload] Got URL:', params.url.substring(0, 80) + '...');
          console.log('🟢 [Upload] Method:', params.method, 'Headers:', params.headers);
          return params;
        } catch (error) {
          console.error('🔴 [Upload] Error getting parameters:', error);
          throw error;
        }
      },
    });

    uppy.on('upload', () => {
      console.log('🔵 [Upload] Starting upload...');
    });

    uppy.on('upload-success', (file, response) => {
      console.log('🟢 [Upload] SUCCESS! File:', file?.name);
      console.log('🟢 [Upload] Response:', response);
    });

    uppy.on('upload-error', (file, error) => {
      console.error('🔴 [Upload] FAILED! File:', file?.name);
      console.error('🔴 [Upload] Error:', error);
    });

    uppyRef.current = uppy;

    return () => {
      uppy.cancelAll();
      uppy.clear();
    };
  }, [maxNumberOfFiles, maxFileSize, onGetUploadParameters]);

  useEffect(() => {
    if (!uppyRef.current) return;

    const handleComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      onComplete?.(result);
      setShowModal(false);
    };

    uppyRef.current.on("complete", handleComplete);

    return () => {
      uppyRef.current?.off("complete", handleComplete);
    };
  }, [onComplete]);

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} type="button">
        {children}
      </Button>

      {uppyRef.current && (
        <DashboardModal
          uppy={uppyRef.current}
          open={showModal}
          onRequestClose={() => setShowModal(false)}
          proudlyDisplayPoweredByUppy={false}
        />
      )}
    </div>
  );
}
