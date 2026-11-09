import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Feather>["name"];

export interface LegalSection {
  title: string;
  icon: IconName;
  paragraphs: string[];
}

export const NOT_MEDICAL_ADVICE = [
  "Blood Biosensor is a personal log for numbers you enter yourself. It is not a medical device and it is not medical advice.",
  "It does not diagnose, treat, cure, or prevent any condition. It does not tell you what a result means for your health.",
  'Words such as "usual range" only compare a number with general published ranges. Those ranges are not personal targets.',
  "Talk with a qualified clinician about your results, and before you change medication, diet, or any other part of your care.",
];

export const PRIVACY_UPDATED = "9 November 2026";

export const PRIVACY_CONTACT_EMAIL = "privacy@example.com";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "What this app is",
    icon: "info",
    paragraphs: [
      "Blood Biosensor is a personal log for blood-related numbers you choose to record, such as glucose, hemoglobin, cholesterol, and platelets. It is not a medical device.",
      "It does not diagnose, treat, cure, or prevent any condition, and it does not interpret what a number means for you.",
    ],
  },
  {
    title: "Stored on this device",
    icon: "smartphone",
    paragraphs: [
      "Readings you add (type, number, date and time, optional notes, optional tags, a fasting flag, and an optional photo), medications you type in, reminder times, and preferences stay on this phone or tablet.",
      "Preferences include your display name, avatar, units, appearance, and the hemoglobin range option. The app also remembers that you acknowledged the notice. Blood Biosensor does not create an account.",
    ],
  },
  {
    title: "No upload, analytics, or ads",
    icon: "eye-off",
    paragraphs: [
      "The app does not send your log to a server. It does not include analytics, advertising, or a crash-reporting service.",
      "The publisher does not receive your readings, notes, photos, or name.",
    ],
  },
  {
    title: "Camera, photos, and microphone",
    icon: "camera",
    paragraphs: [
      "The camera and photo library are used only when you attach a picture to a reading. Pictures stay in local storage.",
      "The app does not record audio and does not request microphone access.",
    ],
  },
  {
    title: "Reminders",
    icon: "bell",
    paragraphs: [
      "If you turn reminders on, the app schedules local notifications on this device. They are not sent from a remote server.",
      "You can turn them off in the app, and you can withdraw notification permission in the system settings.",
    ],
  },
  {
    title: "Exports you choose",
    icon: "share-2",
    paragraphs: [
      "CSV and PDF files are created on this device when you choose Export. A PDF includes the display name. A file leaves the app only if you then share or save it with the system share sheet.",
      "The app does not upload exports on its own. Notes and the display name are written as text. In the PDF they are escaped so they stay text rather than markup.",
    ],
  },
  {
    title: "Clearing data",
    icon: "trash-2",
    paragraphs: [
      "Clear All Data in Profile deletes readings, medications, and preferences from this device and cancels scheduled reminders. The acknowledgement of the notice is kept so it is not shown again on this install.",
      "Removing the app, or clearing its storage in system settings, deletes the local copy, including that acknowledgement. Files you already shared are outside the app and are not deleted here.",
    ],
  },
  {
    title: "Children",
    icon: "users",
    paragraphs: [
      "Blood Biosensor is not directed at children and should not be used as a medical product for a child. It does not knowingly collect personal information on a server, because it has no accounts.",
    ],
  },
  {
    title: "Changes",
    icon: "refresh-cw",
    paragraphs: [
      `If this policy changes, the updated text ships with the app and on the public page. This copy was last updated on ${PRIVACY_UPDATED}.`,
    ],
  },
  {
    title: "Contact",
    icon: "mail",
    paragraphs: [
      `Privacy questions: ${PRIVACY_CONTACT_EMAIL}. The publisher must replace that address with a monitored email before this page is used as the store privacy-policy URL.`,
    ],
  },
];
