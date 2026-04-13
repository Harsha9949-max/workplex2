/**
 * ProofSubmissionModal Component
 * Handles image upload, link submission, and text input
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image, Link, FileText, Upload, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage, uploadToStorage, isValidUrl, countWords, getProofTypeInfo } from '../../utils/tasks';
import { TaskData } from '../../hooks/useTasks';

interface ProofSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskData;
  onSubmit: (proofUrl: string, proofText: string) => Promise<{ success: boolean; error?: string }>;
  isResubmit?: boolean;
}

export const ProofSubmissionModal: React.FC<ProofSubmissionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit,
  isResubmit = false,
}) => {
  const [step, setStep] = useState<'type' | 'input' | 'preview' | 'confirm'>('type');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [linkInput, setLinkInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const proofInfo = getProofTypeInfo(task.proofType);

  const resetState = () => {
    setStep('type');
    setSelectedFile(null);
    setPreviewUrl('');
    setLinkInput('');
    setTextInput('');
    setUploadProgress(0);
    setIsUploading(false);
    setIsSubmitting(false);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    setError('');
    setSelectedFile(file);

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setStep('preview');
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast.loading('Compressing image...', { duration: 2000 });
        const compressed = await compressImage(file, 2);
        const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });
        handleFileSelect(compressedFile);
      } catch (err) {
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const path = `proofs/${task.id}/${Date.now()}_${selectedFile.name}`;
      const compressed = await compressImage(selectedFile, 2);
      const downloadURL = await uploadToStorage(compressed, path, setUploadProgress);

      setPreviewUrl(downloadURL);
      setIsUploading(false);
      setStep('confirm');
    } catch (err: any) {
      setError('Upload failed. Please check your connection and try again.');
      setIsUploading(false);
    }
  };

  const handleLinkSubmit = () => {
    setError('');
    if (!isValidUrl(linkInput)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }
    setStep('confirm');
  };

  const handleTextSubmit = () => {
    setError('');
    const words = countWords(textInput);
    if (words < 10) {
      setError(`Please write at least 10 words (currently ${words})`);
      return;
    }
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      let proofUrl = '';
      let proofText = '';

      if (task.proofType === 'image') {
        proofUrl = isUploading ? '' : previewUrl;
      } else if (task.proofType === 'link') {
        proofUrl = linkInput;
      } else {
        proofText = textInput;
      }

      const result = await onSubmit(proofUrl, proofText);

      if (result.success) {
        toast.success(isResubmit ? 'Proof resubmitted successfully!' : 'Proof submitted successfully!', {
          duration: 3000,
          style: {
            background: '#111111',
            color: '#fff',
            border: '1px solid #10B981',
          },
        });
        handleClose();
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Submit proof"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111111] w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <h3 className="text-white font-bold text-lg">
                {isResubmit ? 'Resubmit Proof' : 'Submit Proof'}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Step 1: Choose Method (for image type) */}
              {step === 'type' && task.proofType === 'image' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm text-center mb-4">
                    {proofInfo.label}
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-2xl border border-gray-800/50 flex flex-col items-center gap-3 transition-all min-h-[44px]"
                  >
                    <Camera size={32} className="text-[#E8B84B]" />
                    <span className="text-white font-semibold">Take Photo</span>
                    <span className="text-gray-500 text-xs">Use your camera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-2xl border border-gray-800/50 flex flex-col items-center gap-3 transition-all min-h-[44px]"
                  >
                    <Image size={32} className="text-[#00C9A7]" />
                    <span className="text-white font-semibold">Choose from Gallery</span>
                    <span className="text-gray-500 text-xs">Select an existing image</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                    aria-label="Select image file"
                  />
                </div>
              )}

              {/* Step 1: Link Input */}
              {step === 'type' && task.proofType === 'link' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Link size={20} className="text-[#E8B84B]" />
                    <p className="text-gray-400 text-sm">{proofInfo.label}</p>
                  </div>

                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com/your-post"
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                    aria-label="Enter URL"
                  />

                  <button
                    onClick={handleLinkSubmit}
                    disabled={!linkInput}
                    className="w-full bg-[#E8B84B] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3 rounded-xl transition-all min-h-[44px]"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 1: Text Input */}
              {step === 'type' && task.proofType === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText size={20} className="text-[#E8B84B]" />
                    <p className="text-gray-400 text-sm">{proofInfo.label}</p>
                  </div>

                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Write your response here..."
                    rows={6}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors resize-none"
                    aria-label="Enter your response"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">
                      {countWords(textInput)} words
                    </span>
                    <button
                      onClick={handleTextSubmit}
                      disabled={countWords(textInput) < 10}
                      className="bg-[#E8B84B] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3 px-8 rounded-xl transition-all min-h-[44px]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Image Preview */}
              {step === 'preview' && previewUrl && (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Proof preview"
                    className="w-full rounded-xl border border-gray-800/50"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPreviewUrl('');
                        setSelectedFile(null);
                        setStep('type');
                      }}
                      className="flex-1 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold rounded-xl transition-all min-h-[44px]"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 bg-[#E8B84B] disabled:bg-gray-700 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
                    >
                      {isUploading ? (
                        <>
                          <Upload size={16} className="animate-spin" />
                          {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload
                        </>
                      )}
                    </button>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#E8B84B] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 'confirm' && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-[#E8B84B]/10 rounded-full flex items-center justify-center mx-auto">
                    <Check size={32} className="text-[#E8B84B]" />
                  </div>

                  <div>
                    <h4 className="text-white font-bold text-lg mb-2">Confirm Submission?</h4>
                    <p className="text-gray-400 text-sm">
                      Once submitted, you cannot edit your proof.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('type')}
                      className="flex-1 py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-400 font-semibold rounded-xl transition-all min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#E8B84B] disabled:bg-gray-700 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Upload size={16} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Confirm & Submit'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
