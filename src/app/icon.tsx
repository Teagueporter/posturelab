import { createAppIcon, iconContentType } from "./app-icon";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = iconContentType;

export default function Icon() {
  return createAppIcon(size);
}
