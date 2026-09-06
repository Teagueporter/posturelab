import { createAppIcon, iconContentType } from "./app-icon";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = iconContentType;

export default function AppleIcon() {
  return createAppIcon(size);
}
