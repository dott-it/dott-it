import CryptoJS from 'crypto-js';

export function decryptName(userName: string | null | undefined): string {
  // Return empty string if userName is null, undefined, or empty
  if (!userName || userName.trim() === '') {
    return '';
  }

  const salt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT;
  if (!salt) {
    return '';
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(userName, salt);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in empty string, it might be invalid encrypted data
    if (!decryptedString || decryptedString.trim() === '') {
      console.warn('Decryption resulted in empty string for userName:', userName);
      return '';
    }
    
    return decryptedString;
  } catch (error) {
    console.error('Error decrypting name:', error);
    return '';
  }
}
