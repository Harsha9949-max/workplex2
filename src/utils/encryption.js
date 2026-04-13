import * as CryptoJS from 'crypto-js';

const AES_SECRET = 'HVRS-WorkPlex-AES-2024';

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, AES_SECRET).toString();
};

export const decrypt = (cipherText) => {
  return CryptoJS.AES.decrypt(cipherText, AES_SECRET).toString(CryptoJS.enc.Utf8);
};

export const generateDeviceFingerprint = () => {
  const fingerprintData = navigator.userAgent + screen.width + screen.height + screen.colorDepth;
  return CryptoJS.SHA256(fingerprintData).toString();
};