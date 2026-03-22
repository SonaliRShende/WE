import { defaultLanguage, supportedLanguages } from "./localeMeta";
import { translations } from "./translations";

export { defaultLanguage, supportedLanguages, translations };

export const getLanguageMeta = (code) =>
  supportedLanguages.find((language) => language.code === code) ?? supportedLanguages[0];

export const formatOptionLabel = (messages, collection, value) => {
  if (!value) {
    return "";
  }

  return messages.taxonomy?.[collection]?.[value] ?? value;
};
