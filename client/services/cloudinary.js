import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'shinken-app';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'shinken_unsigned';
const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

// ─── PICK IMAGE FROM LIBRARY ──────────────────────────────────
export const pickImage = async (options = {}) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission galerie refusée');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options.aspect || [1, 1],
    quality: 0.8,
    ...options,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};

// ─── TAKE PHOTO WITH CAMERA ──────────────────────────────────
export const takePhoto = async (options = {}) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission caméra refusée');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: options.aspect || [1, 1],
    quality: 0.8,
    ...options,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
};

// ─── COMPRESS IMAGE ───────────────────────────────────────────
export const compressImage = async (uri, maxWidth = 500) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
};

// ─── UPLOAD TO CLOUDINARY ─────────────────────────────────────
export const uploadToCloudinary = async (uri, folder = 'shinken/avatars') => {
  // Compress before upload
  const compressed = await compressImage(uri);

  const formData = new FormData();
  formData.append('file', {
    uri: compressed,
    type: 'image/jpeg',
    name: `${folder.replace('/', '_')}_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(`${CLOUDINARY_BASE_URL}/image/upload`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Upload Cloudinary échoué');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
};

// ─── UPLOAD AUDIO TO CLOUDINARY ───────────────────────────────
export const uploadAudioToCloudinary = async (uri, folder = 'shinken/music') => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/mpeg',
    name: `music_${Date.now()}.mp3`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio

  const response = await fetch(`${CLOUDINARY_BASE_URL}/video/upload`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Upload audio échoué');
  }

  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id, duration: data.duration };
};

// ─── GET OPTIMIZED URL ────────────────────────────────────────
export const getOptimizedUrl = (publicId, options = {}) => {
  const { width = 200, height = 200, quality = 'auto', format = 'auto' } = options;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
};

// ─── HELPERS ──────────────────────────────────────────────────
export const AVATAR_FOLDERS = {
  avatar: 'shinken/avatars',
  banner: 'shinken/banners',
  clanLogo: 'shinken/clan_logos',
  clanBanner: 'shinken/clan_banners',
};

export default {
  pickImage, takePhoto, compressImage,
  uploadToCloudinary, uploadAudioToCloudinary,
  getOptimizedUrl, AVATAR_FOLDERS,
};
