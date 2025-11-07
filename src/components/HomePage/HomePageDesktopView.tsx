import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { TFunction } from "i18next";
import type { ChatMessage } from "../../lib/api";
import ChatWindow from "../ChatWindow";
import LanguageSelector from "../LanguageSelector";

interface HomePageDesktopViewProps {
  onCopyLink: () => void;
  onGoBack: () => void;
  parseBoldText: (translatedText: string) => ReactNode;
  currentUrl: string;
  copied: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sessionId: string;
  isThinking: boolean;
  setIsThinking: Dispatch<SetStateAction<boolean>>;
  hasSelectedInitialOption: boolean;
  setHasSelectedInitialOption: Dispatch<SetStateAction<boolean>>;
  t: TFunction;
}

export default function HomePageDesktopView({
  onCopyLink,
  onGoBack,
  parseBoldText,
  currentUrl,
  copied,
  messages,
  setMessages,
  input,
  setInput,
  sessionId,
  isThinking,
  setIsThinking,
  hasSelectedInitialOption,
  setHasSelectedInitialOption,
  t,
}: HomePageDesktopViewProps) {
  const featureKeys = [
    "homepage.features.question_description",
    "homepage.features.time_description",
    "homepage.features.quality_description",
  ] as const;

  return (
    <div className="hidden md:flex h-screen bg-white overflow-hidden">
      {/* Left side - Homepage content */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-white via-brand-50 to-brand-100 flex-col overflow-y-auto">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-start px-10">
          <div className="flex w-full flex-col items-end gap-14">
            {/* Hero Section */}
            <section className="flex w-full flex-col items-center gap-[30px] -mt-[12.5%]">
              <div className="relative flex h-[91px] w-[91px] items-center justify-center">
                <div className="absolute h-full w-full rounded-full border-[8px] border-transparent" aria-hidden />
                <img
                  src="/airsaas-ai-logo.svg"
                  alt="AirSaas AI"
                  className="relative h-[91px] w-[91px]"
                />
              </div>

              <div className="flex w-full flex-col gap-[10px]">
                <h1
                  className="w-full text-center text-[36px] leading-[1.2130000856187608em] text-[#3C51E2] font-normal"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {t("homepage.title")}
                </h1>
                <h2 className="w-full text-center text-[20px] leading-[1.5em] text-[#475467] font-normal">
                  {t("homepage.subtitle")}
                </h2>
              </div>
            </section>

            {/* Text Section - Check items and Share link */}
            <section className="flex w-full flex-col items-center gap-[30px]">
              {/* Features Section - Check items */}
              <ul className="flex w-full flex-col gap-5">
                {featureKeys.map((featureKey) => (
                  <li key={featureKey} className="flex w-full items-start gap-[10px]">
                    <span className="flex h-[28px] w-[12px] items-center justify-center">
                      <span className="h-[9px] w-[9px] rounded-full bg-[#03E26B]" />
                    </span>
                    <p className="flex-1 pt-[3.4px] text-[18px] leading-[1.2130000856187608em] text-[#475467] font-normal">
                      {parseBoldText(t(featureKey))}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Share link section */}
              <div className="flex w-full flex-col gap-[5px]">
                <p className="text-[12px] leading-[15px] text-[#50596F] font-light">
                  {t("homepage.share_link.label", {
                    defaultValue: "Share the link to your teammates",
                  })}
                </p>

                <div className="group flex h-10 w-full items-center justify-between rounded-[10px] border border-[#E5E7EA] bg-white px-4 transition-colors duration-200 hover:border-[#3C51E2] hover:bg-[#F3F3FC]">
                  <div className="flex flex-1 items-center gap-[5px]">
                    <span className="flex h-4 w-[21px] items-center justify-center">
                      <svg
                        width="21"
                        height="16"
                        viewBox="0 0 21 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-[21px]"
                      >
                        <path
                          d="M5.46875 4.125C7 2.5625 9.53125 2.5625 11.0938 4.125C12.5938 5.59375 12.6562 7.96875 11.3125 9.5625L11.125 9.75C10.9375 9.96875 10.625 10 10.4375 9.8125C10.2188 9.625 10.1875 9.3125 10.375 9.09375L10.5312 8.90625C11.5625 7.71875 11.5 5.9375 10.4062 4.84375C9.21875 3.65625 7.34375 3.65625 6.15625 4.84375L2.28125 8.71875C1.09375 9.90625 1.09375 11.7812 2.28125 12.9688C3.4375 14.125 5.34375 14.125 6.5 12.9688L7.21875 12.25C7.40625 12.0625 7.71875 12.0625 7.9375 12.25C8.125 12.4375 8.125 12.7812 7.9375 12.9688L7.21875 13.6562C5.65625 15.2188 3.125 15.2188 1.5625 13.6562C0 12.0938 0 9.5625 1.5625 8L5.46875 4.125ZM14.625 11.9062C13.0938 13.4688 10.5625 13.4688 9 11.9062C7.5 10.4375 7.4375 8.0625 8.78125 6.46875L8.96875 6.28125C9.15625 6.0625 9.46875 6.03125 9.65625 6.21875C9.875 6.40625 9.90625 6.71875 9.71875 6.9375L9.5625 7.125C8.53125 8.3125 8.59375 10.0938 9.6875 11.1875C10.875 12.375 12.75 12.375 13.9375 11.1875L17.8125 7.3125C19 6.125 19 4.25 17.8125 3.0625C16.6562 1.90625 14.75 1.90625 13.5938 3.0625L12.875 3.78125C12.6875 3.96875 12.375 3.96875 12.1562 3.78125C11.9688 3.5625 11.9688 3.25 12.1562 3.0625L12.875 2.34375C14.4375 0.78125 16.9688 0.78125 18.5312 2.34375C20.0938 3.90625 20.0938 6.4375 18.5312 8L14.625 11.9062Z"
                          fill="#061333"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={currentUrl}
                      readOnly
                      className="flex-1 bg-transparent text-[14px] leading-[115%] text-[#061333] font-light outline-none"
                    />
                  </div>

                  <button
                    onClick={onCopyLink}
                    className="flex h-[29px] w-[75px] items-center justify-center gap-[5px] rounded-full bg-transparent text-[#3C51E2] text-[12px] leading-[15px] font-light transition-colors duration-200 hover:bg-[#E8EBFE]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3C51E2"
                      strokeWidth="2"
                      className="h-[14px] w-[14px]"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Right side - Chat Panel */}
      <div className="w-full md:w-1/2 md:border-l border-[#E5E7EA] flex flex-col bg-white relative">
        {/* Language Selector - Only visible on desktop */}
        <div className="hidden md:block absolute top-[10px] right-[10px] md:left-[-140px] z-50">
          <LanguageSelector />
        </div>
        {/* Container with max-width for proportional scaling */}
        <div className="w-full max-w-[640px] xl:max-w-none xl:mx-0 mx-auto h-full flex flex-col overflow-hidden flex-1">
          {/* Chat Section */}
          <ChatWindow
            messages={messages}
            setMessages={setMessages}
            input={input}
            setInput={setInput}
            sessionId={sessionId}
            isThinking={isThinking}
            setIsThinking={setIsThinking}
            hasSelectedInitialOption={hasSelectedInitialOption}
            setHasSelectedInitialOption={setHasSelectedInitialOption}
            isPanel={true}
            onGoBack={onGoBack}
          />
        </div>
      </div>
    </div>
  );
}

