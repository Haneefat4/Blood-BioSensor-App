import * as ImagePicker from "expo-image-picker";

import { PhotoPickError, type PhotoSource } from "@/lib/photoPick";

/** Open the photo library or camera. Returns null when the person cancels. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  if (source === "library") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new PhotoPickError(
        "permission",
        "Please allow access to your photo library to attach images.",
      );
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoPickError(
      "permission",
      "Please allow camera access to take photos.",
    );
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export { PhotoPickError } from "@/lib/photoPick";
export type { PhotoSource } from "@/lib/photoPick";
