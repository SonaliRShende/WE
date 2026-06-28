import { Volume2 } from "lucide-react";
import { speak } from "../utils/speech";
import { useLocale } from "../context/LocaleContext";

export default function SpeakButton({ text }) {

    const { speechLocale } = useLocale();

    return (

        <button
            type="button"
            onClick={() => speak(text, speechLocale)}
            className="flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sky-700 hover:bg-sky-100"
        >

            <div className="flex items-center gap-2">

            <Volume2 size={18}/>

            <span className="text-sm">
                Listen
            </span>

            </div>

        </button>

    );

}