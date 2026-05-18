import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStart = '        {/* Main Structure */}';
const targetEnd = '  }\n\n  return (';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

// Find the last </div> before targetEnd to know where to cut
const beforeEnd = content.substring(startIndex, endIndex);
const lastDivIdx = beforeEnd.lastIndexOf('      </div>\n    );\n');
const actualEndIndex = startIndex + lastDivIdx;

const replaceContent = `        {/* Main Structure */}
        <div className="flex flex-col md:flex-row flex-1 relative z-10 w-full max-w-[1600px] mx-auto border-x border-neo-dark border-opacity-20 shadow-none">
          {/* Left column */}
          <div className="flex-1 border-r border-neo-dark flex flex-col relative p-6 md:p-12 lg:p-20 overflow-y-auto">
            {/* Vertical Japanese text */}
            <div className="absolute left-6 top-20 vertical-text text-xs tracking-[0.6em] font-medium hidden md:block text-neo-dark/70">
              未来を描き、共に創る。
            </div>

            <div className="md:pl-16 relative">
              <h1 className="text-6xl md:text-[6rem] lg:text-[7.5rem] leading-[0.85] font-display font-medium text-neo-dark mb-6 tracking-tighter uppercase relative z-10">
                Fintro <br /> Couple
                <br /> App
              </h1>

              <p className="text-2xl md:text-3xl text-neo-orange font-display mb-12 italic tracking-wide">
                Phiên Bản 2026
              </p>

              <p className="text-xs md:text-sm tracking-[0.15em] uppercase mb-10 max-w-sm leading-relaxed font-semibold text-neo-dark/80">
                Tài Chính, Kết Nối,
                <br /> Tình Yêu, Lạc Quan
              </p>

              {/* Added 3 App Logos to fill empty space */}
              <div className="flex flex-wrap gap-4 md:gap-8 mb-12">
                <div className="flex items-center gap-2 md:gap-3 opacity-90 mix-blend-darken hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-light flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)]">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Tài Chính</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 opacity-90 mix-blend-darken hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-white flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-orange)]">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-neo-orange" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Tình Yêu</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 opacity-90 mix-blend-darken hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-orange flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)]">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                  </div>
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] max-w-[60px] leading-tight">Giải Trí</span>
                </div>
              </div>

              <div className="flex items-end gap-2 text-[10px] md:text-xs font-mono font-bold border border-neo-dark p-2 w-fit mb-12 hover:bg-neo-dark hover:text-neo-light transition-colors cursor-pointer group">
                <span>KẾT NỐI VÀ KIẾN TẠO</span>
                <ArrowRight className="w-3 h-3 group-hover:text-neo-orange transition-colors" />
              </div>
            </div>

            {/* Login Form Area */}
            <div className="mt-auto md:pl-16 max-w-xl">
              <div className="border-t border-neo-dark pt-4 lg:-ml-16 lg:pl-16">
                {systemAnnouncement &&
                  systemAnnouncement.show &&
                  systemAnnouncement.text && (
                    <div className="overflow-hidden whitespace-nowrap border-b border-neo-dark py-2 mb-6 bg-transparent relative flex items-center w-full">
                      <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-neo-dark absolute left-0 bg-transparent z-10 px-4 border-r border-neo-dark">
                        Hệ Thống
                      </span>
                      <marquee
                        className="text-xs font-bold tracking-widest text-neo-orange ml-24"
                        scrollamount="5"
                      >
                        {systemAnnouncement.text}
                      </marquee>
                    </div>
                  )}
                <div className="pt-8 w-full">
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-neo-dark mb-6">
                    Trải nghiệm ngay
                  </p>

                  <div className="grid grid-cols-1 gap-6">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsLoggingIn(true);
                        try {
                          const { signInWithGoogle } =
                            await import("./lib/firebase");
                          await signInWithGoogle();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsLoggingIn(false);
                        }
                      }}
                      disabled={isLoggingIn}
                      className="border border-neo-dark hover:bg-neo-dark hover:text-neo-light p-3 flex items-center justify-center gap-3 w-full uppercase font-bold tracking-widest transition-colors duration-300"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all opacity-80"
                        alt="Google"
                      />
                      <span>Đăng Nhập</span>
                    </button>

                    <form
                      onSubmit={handleConnectSpace}
                      className="pt-4 border-t border-neo-dark/20 space-y-4 relative"
                    >
                      <div className="grid grid-cols-6 gap-2">
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) =>
                            setInviteCode(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          className="border-b border-neo-dark col-span-4 p-2 font-mono font-bold text-center tracking-[0.3em] uppercase bg-transparent outline-none focus:border-neo-orange transition-colors"
                          placeholder="MÃ SỐ (3 số)"
                          maxLength={3}
                        />
                        <button
                          type="submit"
                          disabled={isLoggingIn || inviteCode.length === 0}
                          className="col-span-2 bg-neo-dark text-neo-light flex flex-col items-center justify-center leading-none p-2 hover:bg-neo-orange transition-colors"
                        >
                          {isLoggingIn ? (
                            <div className="w-4 h-4 border-2 border-neo-dark border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="font-bold text-[10px] uppercase tracking-widest">THAM GIA</span>
                          )}
                        </button>
                      </div>
                      {inviteError && (
                        <p className="text-neo-orange text-xs font-bold uppercase tracking-widest text-center mt-2">
                          {inviteError}
                        </p>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column / Graphic */}
          <div className="w-full md:w-[40%] text-neo-dark relative flex flex-col min-h-[500px] border-l border-neo-dark bg-transparent">
            <div className="absolute right-0 top-0 w-[2px] h-full bg-neo-dark/10 z-0" />
            <div className="absolute right-12 top-0 w-[1px] h-full bg-neo-dark/5 z-0" />

            <div className="p-4 md:p-8 border-b border-neo-dark flex items-center justify-between gap-4 relative z-20 bg-transparent backdrop-blur-sm">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {introTab === 0 && (
                    <motion.div
                      key="tab0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-transparent flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)] shrink-0">
                        <Wallet className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Tài Chính</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Quản lý chi tiêu minh bạch, theo dõi ngân sách chung và nền tảng bền vững.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {introTab === 1 && (
                    <motion.div
                      key="tab1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-white flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-orange)] shrink-0">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-neo-orange" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Tình Yêu</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Lưu giữ kỷ niệm, những ngày quan trọng và chia sẻ không gian cảm xúc.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {introTab === 2 && (
                    <motion.div
                      key="tab2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col md:flex-row items-start gap-4"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-neo-dark bg-neo-orange flex items-center justify-center shadow-[3px_3px_0_var(--color-neo-dark)] shrink-0">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-neo-dark" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-display font-medium text-neo-dark mb-2 tracking-tight">Giải Trí</h3>
                        <p className="text-[10px] md:text-xs font-semibold text-neo-dark/80 leading-relaxed max-w-[200px]">
                          Thư giãn với trò chơi thú vị và chia sẻ không gian trò chuyện.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2 md:gap-4 shrink-0 justify-end">
                <button
                  onClick={() => setIntroTab(0)}
                  className={\`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border border-neo-dark p-3 md:p-4 shadow-[-4px_4px_0_var(--color-neo-dark)] transition-colors \${introTab === 0 ? "bg-neo-bg/50" : "bg-transparent opacity-50 hover:opacity-100"}\`}
                >
                  Tài Chính
                </button>
                <button
                  onClick={() => setIntroTab(1)}
                  className={\`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border border-neo-dark p-3 md:p-4 shadow-[-4px_4px_0_var(--color-neo-dark)] transition-colors \${introTab === 1 ? "bg-white text-neo-dark" : "bg-transparent opacity-50 hover:opacity-100"}\`}
                >
                  Tình Yêu
                </button>
                <button
                  onClick={() => setIntroTab(2)}
                  className={\`vertical-text font-display text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold border border-neo-dark p-3 md:p-4 shadow-[-4px_4px_0_var(--color-neo-dark)] transition-colors \${introTab === 2 ? "bg-neo-orange text-neo-dark" : "bg-transparent opacity-50 hover:opacity-100"}\`}
                >
                  Giải Trí
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 flex items-center justify-center relative mt-8 md:mt-12 bg-transparent text-neo-dark">
              {/* Center abstract circle representing sun/horizon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center mix-blend-multiply opacity-50">
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 25,
                    ease: "linear",
                  }}
                  className="w-64 h-64 md:w-[22rem] md:h-[22rem] rounded-full border border-dashed border-neo-dark flex items-center justify-center relative overflow-hidden"
                >
                  <div className="w-full h-[1px] bg-neo-dark absolute top-1/2" />
                  <div className="w-[1px] h-full bg-neo-dark absolute left-1/2" />
                  <div className="w-full h-[1px] bg-neo-dark absolute top-1/2 rotate-45" />
                  <div className="w-[1px] h-full bg-neo-dark absolute left-1/2 -rotate-45" />
                </motion.div>
              </div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 15,
                  ease: "linear",
                }}
                className="w-56 h-56 md:w-72 md:h-72 rounded-full border border-neo-dark shadow-[10px_10px_0_var(--color-neo-dark)] flex items-center justify-center relative z-10 bg-[#e7d8c6] mix-blend-hard-light"
              >
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-full" style={{ transform: "rotate(-90deg)" }} />
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-full" style={{ transform: "rotate(30deg)" }} />
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-neo-dark origin-left mt-[-1px] rounded-full" style={{ transform: "rotate(150deg)" }} />
                {/* Icons around the inner circle */}
                <div className="absolute" style={{ left: "calc(50% + 26%)", top: "calc(50% - 15%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-full shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                  >
                    <Wallet className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "50%", top: "calc(50% + 30%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-full shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                  >
                    <Heart className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                  </motion.div>
                </div>
                <div className="absolute" style={{ left: "calc(50% - 26%)", top: "calc(50% - 15%)", transform: "translate(-50%, -50%)" }}>
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="border border-neo-dark bg-transparent p-2.5 md:p-3.5 rounded-full shadow-[4px_4px_0_var(--color-neo-dark)] flex items-center justify-center"
                  >
                    <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-neo-dark" />
                  </motion.div>
                </div>
                <div className="absolute w-[25%] h-[25%] rounded-full border border-neo-dark bg-transparent z-10" />
              </motion.div>
            </div>

            <div className="p-6 md:p-8 border-t border-neo-dark grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-bold text-neo-dark/80 bg-transparent relative z-20">
              <div>
                <p className="text-neo-dark mb-1">Kiến trúc</p>
                <p>Hệ thống Không</p>
                <p>Cấu trúc 001</p>
              </div>
              <div className="text-right">
                <p className="text-neo-dark mb-1">Trạng thái</p>
                <p>Trực Tuyến</p>
                <p>Dữ Liệu An Toàn</p>
              </div>
            </div>
          </div>
`;

if (startIndex !== -1 && endIndex !== -1 && actualEndIndex !== -1) {
  content = content.substring(0, startIndex) + replaceContent + '\n' + content.substring(actualEndIndex);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Successfully replaced content using inject.js");
} else {
  console.log("Failed to find target strings.", startIndex, endIndex, actualEndIndex);
}
