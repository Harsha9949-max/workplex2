import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Loader2, AlertCircle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../firebase';

export default function Step2Profile({ onNext }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isRejected, setIsRejected] = useState(false);
  
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);

  const validateName = (value) => {
    return value.trim().length > 2;
  };

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const previewURL = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoURL(previewURL);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!validateName(name)) {
      setError('Name must be more than 2 characters');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setIsRejected(true);
      return;
    }

    if (!photoFile) {
      setError('Please upload a profile photo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const storageRef = ref(storage, `profiles/${user.uid}/photo.jpg`);
      await uploadBytes(storageRef, photoFile);
      const downloadURL = await getDownloadURL(storageRef);

      onNext({
        name: name.trim(),
        age: ageNum,
        photoURL: downloadURL,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (isRejected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#2A2A2A]">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle className="w-10 h-10 text-red-500" />
            </motion.div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
              <p className="text-gray-400 text-sm">
                You must be 18+ to join WorkPlex.
              </p>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm text-center">
                Unfortunately, we cannot proceed with your application at this time.
                WorkPlex is exclusively for members aged 18 and above.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#2A2A2A]">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-[#E8B84B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-[#E8B84B]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Basic Profile Info</h2>
            <p className="text-gray-400 text-sm">
              Tell us a bit about yourself
            </p>
          </motion.div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="John Doe"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl py-4 px-4 text-white text-lg font-medium placeholder-gray-600 focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (error) setError('');
                }}
                placeholder="21"
                min="1"
                max="120"
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl py-4 px-4 text-white text-lg font-medium placeholder-gray-600 focus:border-[#E8B84B] focus:ring-1 focus:ring-[#E8B84B] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Profile Photo</label>
              <div
                ref={dragRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200
                  flex flex-col items-center justify-center gap-3
                  ${photoURL
                    ? 'border-[#E8B84B] bg-[#E8B84B]/5'
                    : 'border-[#2A2A2A] hover:border-gray-600'
                  }
                `}
              >
                {photoURL ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <img
                      src={photoURL}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#1A1A1A]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      Click or drag to upload photo
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading || !name || !age || !photoFile}
              className="w-full bg-[#E8B84B] hover:bg-[#D4A43A] disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}